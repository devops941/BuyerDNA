import pandas as pd
import numpy as np
from scipy.cluster.vq import kmeans2
from scipy.spatial.distance import cdist
from typing import List, Dict, Any, Tuple
from app.schemas.clustering import (
    ClusteringCustomerInput, ClusteringConfig, ClusteringResponse,
    ElbowPoint, ClusterCentroid, CustomerClusterResult
)

def compute_silhouette_score(X: np.ndarray, labels: np.ndarray) -> float:
    unique_labels = np.unique(labels)
    if len(unique_labels) < 2 or len(unique_labels) >= len(X):
        return 0.0

    dists = cdist(X, X)
    n = len(X)
    s_scores = []

    for i in range(n):
        same_cluster_mask = (labels == labels[i]) & (np.arange(n) != i)
        if np.sum(same_cluster_mask) == 0:
            s_scores.append(0.0)
            continue
        a_i = np.mean(dists[i, same_cluster_mask])

        b_i = np.inf
        for other_l in unique_labels:
            if other_l == labels[i]:
                continue
            other_mask = (labels == other_l)
            if np.sum(other_mask) > 0:
                b_i = min(b_i, np.mean(dists[i, other_mask]))

        denom = max(a_i, b_i)
        s_i = (b_i - a_i) / denom if denom > 0 else 0.0
        s_scores.append(s_i)

    return float(np.mean(s_scores))

def interpret_cluster(centroid: Dict[str, float], overall_means: Dict[str, float]) -> Tuple[str, str, List[str]]:
    r = centroid.get('recency', 0.0)
    f = centroid.get('frequency', 0.0)
    m = centroid.get('monetary', 0.0)

    mean_r = overall_means.get('recency', 1.0)
    mean_f = overall_means.get('frequency', 1.0)
    mean_m = overall_means.get('monetary', 1.0)

    traits = []
    if m > mean_m * 1.4:
        traits.append("High Monetary Value")
    elif m < mean_m * 0.7:
        traits.append("Budget / Modest Value")
    else:
        traits.append("Average Basket Size")

    if f > mean_f * 1.3:
        traits.append("High Transaction Frequency")
    elif f <= 1.5:
        traits.append("Low Frequency / Single Orders")
    else:
        traits.append("Moderate Repeat Purchase")

    if r < mean_r * 0.7:
        traits.append("Recent Active Engagement")
    elif r > mean_r * 1.3:
        traits.append("Extended Inactivity Window")
    else:
        traits.append("Standard Recency Cycle")

    if m >= mean_m and f >= mean_f and r <= mean_r:
        name = "High-Value Power Shoppers"
        desc = "Frequent buyers driving substantial revenue with active ongoing engagement."
    elif r > mean_r * 1.2 and m >= mean_m:
        name = "High-Spend Lapsed Shoppers"
        desc = "High cumulative spenders who have become dormant in recent purchasing cycles."
    elif r <= mean_r * 0.8 and f <= mean_f:
        name = "Recent First-Time Explorers"
        desc = "Newly acquired customers testing the product range with initial transactions."
    elif f > mean_f * 1.2 and m < mean_m:
        name = "High-Frequency Bargain Hunters"
        desc = "Frequent transactional shoppers with smaller average basket sizes and price sensitivity."
    elif r > mean_r and f <= mean_f and m < mean_m:
        name = "Dormant Low-Engagement Casuals"
        desc = "Infrequent historical shoppers who are nearing permanent attrition."
    else:
        name = "Core Mainstream Regulars"
        desc = "Steady recurring customers with average basket size and predictable repurchase habits."

    return name, desc, traits

def run_clustering(customers: List[ClusteringCustomerInput], config: ClusteringConfig) -> ClusteringResponse:
    if len(customers) < 4:
        raise ValueError("At least 4 customers required for K-Means clustering.")

    df = pd.DataFrame([c.model_dump() for c in customers])
    feature_cols = [f for f in config.features if f in df.columns]
    if not feature_cols:
        feature_cols = ['recency', 'frequency', 'monetary', 'avg_order_value']

    X_raw = df[feature_cols].values.astype(float)

    # Log1p transform for monetary and frequency to stabilize variance
    X_log = X_raw.copy()
    for idx, col in enumerate(feature_cols):
        if col in ['monetary', 'frequency', 'avg_order_value']:
            X_log[:, idx] = np.log1p(np.maximum(0, X_log[:, idx]))

    # Standard scaling (Z-score normalization)
    means = np.mean(X_log, axis=0)
    stds = np.std(X_log, axis=0)
    stds[stds == 0] = 1.0
    X_scaled = (X_log - means) / stds

    total_samples = len(df)
    max_k = min(config.k_max, total_samples - 1)
    min_k = max(2, min(config.k_min, max_k))

    elbow_points: List[ElbowPoint] = []
    best_k = min(config.n_clusters, max_k)
    highest_silhouette = -1.0

    for k in range(min_k, max_k + 1):
        try:
            centroids, labels = kmeans2(X_scaled, k, minit='points', iter=20)
            # WCSS
            wcss = float(np.sum((X_scaled - centroids[labels]) ** 2))
            sil = compute_silhouette_score(X_scaled, labels)
            elbow_points.append(ElbowPoint(k=k, wcss=round(wcss, 2), silhouette=round(sil, 3)))

            if sil > highest_silhouette:
                highest_silhouette = sil
                best_k = k
        except Exception:
            pass

    chosen_k = best_k if config.auto_detect_k else min(config.n_clusters, max_k)
    
    # Fit final clustering with chosen_k
    centroids, cluster_labels = kmeans2(X_scaled, chosen_k, minit='points', iter=30)
    df['cluster_id'] = cluster_labels

    final_silhouette = compute_silhouette_score(X_scaled, cluster_labels)

    # 2D PCA using SVD
    X_centered = X_scaled - np.mean(X_scaled, axis=0)
    _, _, vt = np.linalg.svd(X_centered, full_matrices=False)
    pca_2d = np.dot(X_centered, vt[:2].T)
    df['pca_x'] = pca_2d[:, 0].round(3)
    df['pca_y'] = pca_2d[:, 1].round(3)

    # Overall feature means
    overall_means = {col: float(df[col].mean()) for col in feature_cols}

    clusters: List[ClusterCentroid] = []
    cluster_name_map = {}

    for c_id in range(chosen_k):
        sub = df[df['cluster_id'] == c_id]
        c_count = len(sub)
        pct = round((c_count / total_samples) * 100, 2)

        c_means = {col: float(sub[col].mean()) if not sub.empty else 0.0 for col in feature_cols}
        name, desc, traits = interpret_cluster(c_means, overall_means)
        cluster_name_map[c_id] = name

        clusters.append(ClusterCentroid(
            cluster_id=c_id,
            name=name,
            description=desc,
            customer_count=c_count,
            percentage=pct,
            avg_recency=round(float(sub['recency'].mean()), 1) if not sub.empty else 0.0,
            avg_frequency=round(float(sub['frequency'].mean()), 1) if not sub.empty else 0.0,
            avg_monetary=round(float(sub['monetary'].mean()), 2) if not sub.empty else 0.0,
            avg_aov=round(float(sub['avg_order_value'].mean()), 2) if not sub.empty else 0.0,
            total_spending=round(float(sub['monetary'].sum()), 2) if not sub.empty else 0.0,
            dominant_traits=traits
        ))

    customer_assignments: List[CustomerClusterResult] = [
        CustomerClusterResult(
            customer_id=str(row['customer_id']),
            cluster_id=int(row['cluster_id']),
            cluster_name=cluster_name_map[int(row['cluster_id'])],
            pca_x=float(row['pca_x']),
            pca_y=float(row['pca_y'])
        )
        for _, row in df.iterrows()
    ]

    return ClusteringResponse(
        status="success",
        optimal_k=best_k,
        chosen_k=chosen_k,
        silhouette_score=round(final_silhouette, 3),
        elbow_curve=elbow_points,
        clusters=clusters,
        customer_assignments=customer_assignments,
        features_used=feature_cols
    )


# Detailed Methodology: Automated Cartilage Fibril Orientation Analysis

## 1. Image Acquisition & Preprocessing
*   **Input Data**: High-resolution Polarized Light Microscopy (PLM) images (uncompressed BGR format) are loaded into the analysis pipeline.
*   **Color Space Transformation**: 
    *   Original RGB pixels are transformed into the **HSV (Hue, Saturation, Value)** color space.
    *   *Scientific Rationale*: The 'Hue' channel ($H$) captures the dominant birefringence color, which correlates directly to collagen fibril orientation, independent of illumination intensity ($V$) or color purity ($S$).
*   **Noise Reduction (Dual-Threshold Masking)**:
    *   To eliminate background noise and non-birefringent artifacts, a binary mask $M(x,y)$ is generated:
        $$ M(x,y) = \begin{cases} 1 & \text{if } V(x,y) > 10 \text{ AND } S(x,y) > 10 \\ 0 & \text{otherwise} \end{cases} $$
    *   Only pixels where $M(x,y)=1$ are retained for analysis.

## 2. Reference-Based Calibration
To ensure consistency across heterogeneous samples (e.g., Healthy vs. Degraded), the system utilizes a **Reference Calibration** step:
1.  **Zone Identification**: A healthy reference image is used to identify the characteristic hues of the Superficial Zone (SZ) and Deep Zone (DZ).
2.  **Anchor Calculation**:
    *   **$H_0$ (0° Anchor)**: Computed as the median hue of the SZ (top 10% of tissue). Representing fibrils parallel to the surface.
    *   **$H_{90}$ (90° Anchor)**: Computed as the median hue of the DZ (bottom 60% of tissue). Representing fibrils perpendicular to the calcified interface.
3.  **Global Application**: These anchors $[H_0, H_{90}]$ are stored and applied to all subsequent "Batch" images (e.g., Osteoarthritic samples), ensuring that color shifts are interpreted relative to the healthy baseline.

## 3. Standardized Zonal Segmentation
The tissue depth is normalized ($d \in [0, 1]$) from the articular surface to the cartilage-bone interface. Regions are segmented into anatomical zones:
*   **Superficial Zone (SZ)**: $0 \le d < 0.10$ (Top 10%)
*   **Middle Zone (MZ)**: $0.10 \le d < 0.40$ (Next 30%)
*   **Deep Zone (DZ)**: $0.40 \le d \le 1.00$ (Bottom 60%)

## 4. Quantitative Fibril Angle Calculation
For every valid pixel $i$ with hue $H_i$, the collagen fibril orientation angle $\theta_i$ is calculated using linear interpolation relative to the calibrated anchors:

$$ \theta_i = \left( \frac{H_i - H_0}{H_{90} - H_0} \right) \times 90^\circ $$

*   *Constraints*: Resulting angles are clipped to the range $[0^\circ, 90^\circ]$.
*   *Handling Circularity*: Circular statistics (mean of sine/cosine components) are used when averaging hues within depth bins to avoid wrapping errors at the 0°/180° boundaries.

## 5. Depth Profiling
1.  **Binning**: The normalized depth is discretized into 100 vertical bins.
2.  **Aggregation**: For each bin $b$, the mean orientation angle $\bar{\theta}_b$ and standard deviation $\sigma_b$ are computed.
3.  **Output**: This generates a continuous **Depth vs. Angle** curve, allowing for direct statistical comparison (e.g., Root Mean Square Error) between Healthy and Degraded profiles.

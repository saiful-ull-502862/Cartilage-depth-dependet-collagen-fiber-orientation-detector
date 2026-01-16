
import shutil

src = r"C:/Users/Saiful Islam/.gemini/antigravity/brain/f2c7011a-82f2-43d5-bff4-552a10c31226/rgb_hsv_clean_1767912863617.png"
dst = r"f:/Test/cartilage_analysis_app/Methodology_Report/Methodology_Figure_RGB_HSV_Transform.png"

shutil.copy(src, dst)
print("Saved RGB to HSV figure!")

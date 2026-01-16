
from PIL import Image
import os

# Source path from the previous turn's output
source_path = r"C:/Users/Saiful Islam/.gemini/antigravity/brain/f2c7011a-82f2-43d5-bff4-552a10c31226/detailed_master_workflow_1767897740225.png"
output_dir = r"f:\Test\cartilage_analysis_app\Methodology_Report"
output_filename = "detailed_master_workflow.jpg"
output_path = os.path.join(output_dir, output_filename)

try:
    if os.path.exists(source_path):
        # Open the PNG image
        img = Image.open(source_path)
        
        # Convert to RGB (standard JPG doesn't support transparency)
        rgb_img = img.convert('RGB')
        
        # Save as JPG
        rgb_img.save(output_path, quality=95)
        print(f"Successfully saved image to: {output_path}")
    else:
        print(f"Error: Source file not found at {source_path}")

except Exception as e:
    print(f"An error occurred: {e}")

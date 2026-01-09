from PIL import Image
import sys

def check_borders(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert('RGBA')
        width, height = img.size
        
        # Check corners and edges
        points = [
            (0, 0), (width-1, 0), (0, height-1), (width-1, height-1), # Corners
            (width//2, 0), (width//2, height-1), (0, height//2), (width-1, height//2) # Mid-edges
        ]
        
        print(f"Image mode: {img.mode}")
        print(f"Size: {width}x{height}")
        
        print("Checking edge pixels (R, G, B, A):")
        for x, y in points:
            pixel = img.getpixel((x, y))
            print(f"Pixel at ({x}, {y}): {pixel}")
            
        # Check for transparency
        extrema = img.getextrema()
        print(f"RGBA Extrema: {extrema}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_borders('public/universe.png')

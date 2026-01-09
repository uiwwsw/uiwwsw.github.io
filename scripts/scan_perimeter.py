from PIL import Image
import sys

def check_perimeter(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert('RGBA')
        width, height = img.size
        
        print(f"Checking perimeter of {width}x{height} image...")
        
        white_threshold = 200 # Consider pixels with RGB > 200 as "whitish"
        border_pixels = []
        
        # Check Top and Bottom rows
        for x in range(width):
            # Top
            p_top = img.getpixel((x, 0))
            if p_top[0] > white_threshold and p_top[1] > white_threshold and p_top[2] > white_threshold:
                border_pixels.append(f"Top({x},0): {p_top}")
            
            # Bottom
            p_btm = img.getpixel((x, height-1))
            if p_btm[0] > white_threshold and p_btm[1] > white_threshold and p_btm[2] > white_threshold:
                border_pixels.append(f"Btm({x},{height-1}): {p_btm}")

        # Check Left and Right columns (excluding corners already checked)
        for y in range(1, height-1):
            # Left
            p_left = img.getpixel((0, y))
            if p_left[0] > white_threshold and p_left[1] > white_threshold and p_left[2] > white_threshold:
                border_pixels.append(f"Left(0,{y}): {p_left}")
                
            # Right
            p_right = img.getpixel((width-1, y))
            if p_right[0] > white_threshold and p_right[1] > white_threshold and p_right[2] > white_threshold:
                border_pixels.append(f"Right({width-1},{y}): {p_right}")

        if border_pixels:
            print(f"FOUND {len(border_pixels)} whitish pixels on the border!")
            # Print first 5
            for p in border_pixels[:5]:
                print(p)
        else:
            print("No whitish pixels found on the immediate 1px border.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_perimeter('public/universe.png')

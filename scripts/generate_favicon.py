from PIL import Image
import os

def create_ico(source_path, output_path):
    try:
        img = Image.open(source_path)
        # Create multiple sizes for the ICO
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        img.save(output_path, format='ICO', sizes=sizes)
        print(f"Successfully created {output_path}")
    except Exception as e:
        print(f"Error creating ICO: {e}")

if __name__ == "__main__":
    create_ico('public/universe.png', 'public/favicon.ico')

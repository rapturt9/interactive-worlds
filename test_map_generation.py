#!/usr/bin/env python3
"""
Quick test script for map generation using OpenRouter GPT-5 Image Mini
Run this to verify your setup before using the full notebook.
"""

import requests
import json
import base64
import os
from PIL import Image
import io

# Configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
MODEL = "openai/gpt-5-image-mini"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

def generate_test_tile():
    """Generate a single test tile to verify the API is working"""

    if not OPENROUTER_API_KEY:
        print("❌ Error: OPENROUTER_API_KEY environment variable not set!")
        print("Set it with: export OPENROUTER_API_KEY='your-key-here'")
        return False

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = """
    Create a top-down 2D pixel art RPG map tile showing a small grassy area
    with a dirt path, a few trees, and some flowers.
    Classic 16-bit RPG style like SNES era games.
    """

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "modalities": ["image", "text"],
        "image_config": {
            "aspect_ratio": "1:1"
        }
    }

    print(f"🎨 Generating test map tile with {MODEL}...")
    print(f"📝 Prompt: {prompt.strip()[:80]}...")

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=120)

        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            return False

        result = response.json()

        # Extract image from response
        if result.get("choices"):
            message = result["choices"][0]["message"]
            if message.get("images"):
                image_url = message["images"][0]["image_url"]["url"]

                # Decode and save image
                if image_url.startswith('data:image'):
                    base64_string = image_url.split(',')[1]
                else:
                    base64_string = image_url

                image_data = base64.b64decode(base64_string)
                img = Image.open(io.BytesIO(image_data))

                # Create outputs directory if it doesn't exist
                os.makedirs("outputs", exist_ok=True)

                output_path = "outputs/test_tile.png"
                img.save(output_path)

                print(f"✅ Success! Image saved to: {output_path}")
                print(f"📐 Image size: {img.size[0]}x{img.size[1]} pixels")
                print(f"🎉 Your setup is working correctly!")

                # Also print text response if any
                if message.get("content"):
                    print(f"💬 Model response: {message['content']}")

                return True
            else:
                print("❌ No image in response")
                if message.get("content"):
                    print(f"Text response: {message['content']}")
                print("\nFull response:")
                print(json.dumps(result, indent=2))
                return False
        else:
            print("❌ No choices in response")
            print(json.dumps(result, indent=2))
            return False

    except requests.exceptions.Timeout:
        print("❌ Request timed out. The model might be taking longer than expected.")
        print("Try running again or check OpenRouter status.")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    print("="*60)
    print("Map Generation Test - OpenRouter GPT-5 Image Mini")
    print("="*60)
    print()

    success = generate_test_tile()

    print()
    print("="*60)
    if success:
        print("✅ Test completed successfully!")
        print()
        print("Next steps:")
        print("1. Open outputs/test_tile.png to see your generated tile")
        print("2. Run the full Jupyter notebook: jupyter notebook map_generation_testing.ipynb")
        print("3. Experiment with different prompts and settings")
    else:
        print("❌ Test failed. Please check the errors above.")
        print()
        print("Common issues:")
        print("- Make sure OPENROUTER_API_KEY is set correctly")
        print("- Verify you have credits in your OpenRouter account")
        print("- Check if the model is available: https://openrouter.ai/models")
    print("="*60)

if __name__ == "__main__":
    main()

# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_bytes(
                    mime_type="image/png",
                    data=base64.b64decode(
                        """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"""
                    ),
                ),
                types.Part.from_text(text="""make app icon"""),
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
        ),
        media_resolution="MEDIA_RESOLUTION_HIGH",
        tools=tools,
        response_mime_type="application/json",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()

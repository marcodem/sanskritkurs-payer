import os
import re
import time
import json
import argparse
import urllib.request
import urllib.error

OLLAMA_URL = "http://192.168.1.44:11434/api/chat"
MODEL = "gemma4:26b"

SYSTEM_PROMPT = """You are an expert academic translator specializing in Sanskrit grammar and German-to-English translations.
Your task is to translate the provided German markdown text into English, adhering to the "Scholarly Synthesis" design system.

CRITICAL RULES:
1. Tone: High-end editorial, scholarly, authoritative.
2. Formats: Preserve ALL markdown syntax, including tables, blockquotes, alerts (e.g., `> [!INFO]`), HTML tags, and image links (`![]()`). Do NOT alter URLs or image paths.
3. Language: Keep all Sanskrit (Devanagari and IAST transliterations) EXACTLY as they are. Do not translate or modify the Sanskrit.
4. Completeness: Translate the text fully without truncating or removing any explanations, lists, or grammatical tables.
5. Provide ONLY the translated markdown text without extra conversational wrapper text."""

def chunk_markdown(content):
    """
    Split the markdown content by H2 headers (## ) to ensure we don't hit output token limits.
    """
    # Use regex to split at the beginning of '## '
    chunks = re.split(r'(?=\n## )', content)
    # Filter out empty chunks
    chunks = [c.strip() for c in chunks if c.strip() != '']
    return chunks

def translate_chunk(chunk_text, max_retries=3):
    for attempt in range(max_retries):
        try:
            data = {
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Please translate the following segment:\n\n{chunk_text}"}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.1
                }
            }
            
            req = urllib.request.Request(OLLAMA_URL, data=json.dumps(data).encode('utf-8'))
            req.add_header('Content-Type', 'application/json')
            
            response = urllib.request.urlopen(req, timeout=1200) # Give it 20 minutes for generation
            resp_data = json.loads(response.read().decode('utf-8'))
            
            translated_content = resp_data.get('message', {}).get('content', '').strip()
            return translated_content
            
        except urllib.error.URLError as e:
            print(f"  [Error] Network error reaching Ollama: {e.reason}. Retrying {attempt + 1}/{max_retries}...")
            time.sleep(5)
        except Exception as e:
            print(f"  [Error] Translation failed: {e}. Retrying {attempt + 1}/{max_retries}...")
            time.sleep(2)
            
    return None

def process_file(de_path, en_path):
    print(f"\nProcessing: {de_path}")
    with open(de_path, 'r', encoding='utf-8') as f:
        de_content = f.read()

    chunks = chunk_markdown(de_content)
    print(f"  Split into {len(chunks)} chunks.")

    translated_chunks = []
    for i, chunk in enumerate(chunks):
        print(f"  Translating chunk {i+1}/{len(chunks)}... ({len(chunk)} characters)")
        en_chunk = translate_chunk(chunk)
        if not en_chunk:
            print(f"  [Fatal] Could not translate chunk {i+1}. Skipping rest of file.")
            return False
            
        # Clean up any AI wrapper lines like "```markdown" if the AI added it
        en_chunk = re.sub(r'^```markdown\s*', '', en_chunk)
        en_chunk = re.sub(r'\s*```$', '', en_chunk)
        
        # Clean up invisible/accidental whitespace injected in image URLs
        en_chunk = re.sub(r'(/images/)\s+', r'\1', en_chunk)
        
        translated_chunks.append(en_chunk)
    
    # Combine chunks
    final_content = "\n\n".join(translated_chunks)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(en_path), exist_ok=True)
    
    # Write output
    with open(en_path, 'w', encoding='utf-8') as f:
        f.write(final_content + "\n")
    print(f"  Saved translated file: {en_path}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Batch translate documentation using Ollama")
    parser.add_argument("--files", nargs='+', help="List of markdown files to translate (basenames like lektion07.md)", required=True)
    args = parser.parse_args()

    de_dir = "/Volumes/SanDisk1TB/proj/Payer/docs/lektionen"
    en_dir = "/Volumes/SanDisk1TB/proj/Payer/docs/en/lektionen"

    for basename in args.files:
        de_path = os.path.join(de_dir, basename)
        en_path = os.path.join(en_dir, basename)

        if not os.path.exists(de_path):
            print(f"Warning: Source file {de_path} does not exist. Skipping.")
            continue

        success = process_file(de_path, en_path)
        if not success:
            print(f"Error processing {basename}.")
        
        # Small delay
        time.sleep(1)

if __name__ == "__main__":
    main()

import os
import re

de_dir = "/Volumes/SanDisk1TB/proj/Payer/docs/lektionen"
en_dir = "/Volumes/SanDisk1TB/proj/Payer/docs/en/lektionen"

# Make sure docs/en/lektionen exists
if not os.path.exists(en_dir):
    print("English directory not found!")
    exit(1)

def extract_images(text):
    # Matches markdown images: ![alt](url)
    return re.findall(r'!\[.*?\]\(.*?\)', text)

def analyze():
    de_files = [f for f in os.listdir(de_dir) if f.endswith('.md')]
    
    issues = []
    
    for filename in sorted(de_files):
        de_path = os.path.join(de_dir, filename)
        en_path = os.path.join(en_dir, filename)
        
        if not os.path.exists(en_path):
            issues.append({'file': filename, 'issue': 'Missing EN file completely'})
            continue
            
        with open(de_path, 'r', encoding='utf-8') as f:
            de_content = f.read()
        with open(en_path, 'r', encoding='utf-8') as f:
            en_content = f.read()
            
        de_len = len(de_content)
        en_len = len(en_content)
        
        de_images = extract_images(de_content)
        en_images = extract_images(en_content)
        
        file_issues = []
        
        # Check 1: Length Ratio
        # English is typically similar length or slightly shorter/longer than German.
        # If it's less than 65% of the German length, it's highly likely truncated.
        if de_len > 0:
            ratio = en_len / de_len
            if ratio < 0.65:
                file_issues.append(f"Length too short: EN is {ratio:.1%} the size of DE ({en_len} vs {de_len} chars)")
        
        # Check 2: Missing Images
        if len(en_images) < len(de_images):
            file_issues.append(f"Missing images: DE has {len(de_images)}, EN has {len(en_images)}")
            
        # Optional: Check if ending with typical translation artifacts
        if "translation continues" in en_content.lower() or "to be continued" in en_content.lower():
            file_issues.append("Contains 'to be continued' or similar truncation strings")
            
        if file_issues:
            issues.append({'file': filename, 'issues': file_issues})
            
    print("# Translation Audit Results")
    print(f"Total DE files checked: {len(de_files)}")
    print(f"Files with issues: {len(issues)}\n")
    
    for i in issues:
        print(f"## {i['file']}")
        if isinstance(i['issue'], str) if 'issue' in i else False:
            print(f"- {i['issue']}")
        else:
            for error in i['issues']:
                print(f"- {error}")
        print()

if __name__ == "__main__":
    analyze()

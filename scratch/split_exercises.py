import os
import re

directory = "/Volumes/SanDisk1TB/proj/Payer/docs/lektionen"
info_header = """> [!INFO] Zitierweise & Rechte
> Dieses Kapitel ist Teil des Sanskritkurses. Details zum Copyright und zur Zitierweise der Ursprungsfassung siehe: [Impressum & Copyright](/impressum)

"""

# Map to store content: lesson_number -> list of sections
extracted_content = {}

def get_lesson_num(title):
    match = re.search(r"Lektion\s+(\d+)", title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

# 1. Read all uebung*.md files
files = [f for f in os.listdir(directory) if f.startswith("uebung") and f.endswith(".md")]

for filename in files:
    path = os.path.join(directory, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by level 2 headers (##)
    sections = re.split(r'^(##\s+.*)$', content, flags=re.MULTILINE)
    
    current_lesson = None
    
    # The first element might be the header before any ##
    for i in range(1, len(sections), 2):
        header = sections[i]
        body = sections[i+1] if i+1 < len(sections) else ""
        
        lesson_num = get_lesson_num(header)
        if lesson_num:
            if lesson_num not in extracted_content:
                extracted_content[lesson_num] = []
            extracted_content[lesson_num].append(header + body)

# 2. Re-distribute content
# First, let's clear out all existing uebung*.md files so we start fresh
for filename in files:
    os.remove(os.path.join(directory, filename))

# 3. Write new files
for lesson_num in sorted(extracted_content.keys()):
    filename = f"uebung{lesson_num:02d}.md"
    path = os.path.join(directory, filename)
    
    # Combine all sections for this lesson
    full_body = "".join(extracted_content[lesson_num])
    
    # Ensure it starts with # Title
    final_content = info_header + f"# Übung Lektion {lesson_num}\n\n" + full_body
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(final_content)

print(f"Distributed exercises for {len(extracted_content)} lessons.")

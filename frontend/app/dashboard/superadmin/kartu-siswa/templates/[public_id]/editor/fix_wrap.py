import re

filepath = 'page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove whitespace-nowrap and replace with break-words or similar, or just remove if regular wrap is fine
content = content.replace('whitespace-nowrap', '')

# Remove the inner div with transform and transformOrigin
pattern = r"(<div style={{\s*transformOrigin:\s*'.*?',\s*transform:\s*(?:canvasState.*?|'none'),\s*width:\s*'100%',\s*}}>\s*)(.*?)(\s*<\/div>)"

def replacer(match):
    inner_text = match.group(2)
    # Return just the text in a span that ensures wrapping 
    return f"""<span style={{ display: 'block', width: '100%', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.2' }}>{inner_text.strip()}</span>"""

content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("page.tsx updated successfully!")

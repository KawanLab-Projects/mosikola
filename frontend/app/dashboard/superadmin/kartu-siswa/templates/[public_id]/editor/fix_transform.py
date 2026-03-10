import re
import os

filepath = 'page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def process_rnd_element(element_name, default_mock_text, width_offset, default_font_size, has_transform_before=True, is_school=False, is_name=False):
    global content
    
    # We want to match the whole Rnd tag for a given element.
    # It's usually like:
    # {canvasState.ELEMENT_NAME.visible && (
    #     <Rnd
    #         ....
    #         style={{
    #             fontSize: ...,
    #             color: ...,
    #             fontFamily: ...,
    #             fontWeight: ...,
    #             fontStyle: ...,
    #             [transformOrigin: ...,]
    #             [transform: ...,]
    #         }}
    #     >
    #         {MOCK_TEXT}
    #     </Rnd>
    # )}
    
    # Let's craft a regex that finds the style block and the inner content
    
    pattern = r"({\s*canvasState\." + element_name + r"\.visible\s*&&\s*\(\s*<Rnd.*?style={{\s*)(.*?)(\s*}}\s*>)(.*?)(\s*<\/Rnd>\s*\)\})"
    
    def replacer(match):
        pre_style = match.group(1)
        style_content = match.group(2)
        post_style_open = match.group(3)
        inner_content = match.group(4)
        post_rnd_close = match.group(5)
        
        # Remove transform and transformOrigin from outer style if they exist
        new_style_content = re.sub(r"transformOrigin:\s*'.*?',\s*", "", style_content)
        new_style_content = re.sub(r"transform:\s*canvasState.*?,\s*", "", new_style_content)
        
        # Determine the origin based on alignment
        origin = "'center center'" if 'kepala' in element_name else "'left center'"
        
        # Fallback text inside transform logic
        text_var = f"canvasState.{element_name}.text || {default_mock_text}"
        
        if element_name == 'name' or element_name == 'nisn' or element_name == 'birth_info' or element_name == 'jurusan':
            text_var = default_mock_text
            
        if is_school:
            text_var = f"canvasState.{element_name}.text || {default_mock_text}"
            
        scale_logic = f"canvasState.{element_name}.width ? getScaleTransform({text_var}, canvasState.{element_name}.width - 12, canvasState.{element_name}.fontSize || {default_font_size}) : 'none'"
        
        new_inner = f"""
                                    <div style={{{{
                                        transformOrigin: {origin},
                                        transform: {scale_logic},
                                        width: '100%',
                                    }}}}>
{inner_content}
                                    </div>"""
                                    
        return pre_style + new_style_content + post_style_open + new_inner + post_rnd_close
        
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)


process_rnd_element('school_name', 'MOCK_STUDENT.school_name', 12, 16, True, True)
process_rnd_element('name', 'MOCK_STUDENT.name', 12, 18, True, False, True)
process_rnd_element('nisn', 'MOCK_STUDENT.nisn', 12, 14, True)
process_rnd_element('birth_info', 'MOCK_STUDENT.birth_info', 12, 14, True)
process_rnd_element('jurusan', 'MOCK_STUDENT.jurusan', 12, 14, False)
process_rnd_element('back_school_name', 'MOCK_STUDENT.school_name', 12, 14, True, True)
process_rnd_element('back_nama_kepala_sekolah', 'MOCK_STUDENT.back_nama_kepala_sekolah', 12, 14, True)
process_rnd_element('back_nip_kepala_sekolah', 'MOCK_STUDENT.back_nip_kepala_sekolah', 12, 14, True)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully!")

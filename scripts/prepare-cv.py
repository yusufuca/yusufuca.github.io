"""Render the configured CV and extract its links; no manual hotspot editing."""
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
config = ROOT / 'data/site.json'
site = json.loads(config.read_text(encoding='utf-8'))
if not site.get('cvUrl'):
    raise SystemExit('No CV configured.')
source = (ROOT / site['cvUrl']).resolve()
if not source.is_relative_to(ROOT) or source.suffix.lower() != '.pdf':
    raise ValueError('cvUrl must reference a PDF inside the site.')

document = pdfium.PdfDocument(source)
pages = []
links = []
offset = 0
for index in range(len(document)):
    page = document[index]
    width, height = page.get_size()
    scale = 1500 / width
    bitmap = page.render(scale=scale)
    image = bitmap.to_pil().convert('RGB')
    pages.append(image)
    offset += image.height
    page.close()
document.close()

canvas = Image.new('RGB', (1500, offset), 'white')
reader = PdfReader(source)
offset = 0
for page, image in zip(reader.pages, pages):
    canvas.paste(image, (0, offset))
    # Match PDFium's visible crop and rotation before calculating image coordinates.
    page.transfer_rotation_to_content()
    crop = page.cropbox
    for ref in page.get('/Annots', []):
        annotation = ref.get_object()
        action = annotation.get('/A', {})
        url = str(action.get('/URI', ''))
        if annotation.get('/Subtype') != '/Link' or urlsplit(url).scheme not in ('http', 'https', 'mailto'):
            continue
        x0, y0, x1, y1 = map(float, annotation['/Rect'])
        links.append({
            'url': url,
            'label': url.removeprefix('https://').removeprefix('http://'),
            'left': round((x0-float(crop.left))/float(crop.width)*100, 6),
            'top': round((offset+(float(crop.top)-y1)/float(crop.height)*image.height)/canvas.height*100, 6),
            'width': round((x1-x0)/float(crop.width)*100, 6),
            'height': round((y1-y0)/float(crop.height)*image.height/canvas.height*100, 6),
        })
    offset += image.height

preview = source.with_name(source.stem + '-preview.webp')
canvas.save(preview, 'WEBP', quality=92, method=6)
site.update({
    'cvPreviewUrl': preview.relative_to(ROOT).as_posix(),
    'cvPreviewFor': site['cvUrl'],
    'cvPreviewVersion': hashlib.sha256(source.read_bytes()).hexdigest()[:12],
    'cvPreviewWidth': canvas.width,
    'cvPreviewHeight': canvas.height,
    'cvPreviewLinks': links,
})
config.write_text(json.dumps(site, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'CV preview generated: {len(pages)} page(s), {len(links)} links.')

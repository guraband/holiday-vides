import json, urllib.request, time, pathlib, shutil, glob

ROOT = pathlib.Path('/Users/ned/workspace/ng/holiday-vides')
PROMPTS = json.loads((ROOT / 'tools' / 'doomsday_image_prompts.json').read_text())
API = 'http://127.0.0.1:8000'
OUTDIR = ROOT / 'src' / 'content' / 'images'
MODEL = 'z_image_turbo_bf16.safetensors'
CLIP = 'qwen_3_4b_fp4_mixed.safetensors'
VAE = 'ae.safetensors'
BASE_NEG = 'lowres, blurry, deformed hands, bad anatomy, extra fingers, duplicate character, cropped face, unreadable text, watermark, logo, overexposed, underexposed, messy composition'

def post_json(path, payload):
    req = urllib.request.Request(API + path, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read().decode())

def get_json(path):
    return json.loads(urllib.request.urlopen(API + path).read().decode())

def submit(node, prompt, negative, seed):
    prefix = f'tmp_doomsday_{node}'
    workflow={
      '1': {'class_type':'UNETLoader','inputs':{'unet_name':MODEL,'weight_dtype':'default'}},
      '2': {'class_type':'CLIPLoader','inputs':{'clip_name':CLIP,'type':'qwen_image','device':'default'}},
      '3': {'class_type':'CLIPTextEncode','inputs':{'text':prompt,'clip':['2',0]}},
      '4': {'class_type':'CLIPTextEncode','inputs':{'text':negative,'clip':['2',0]}},
      '5': {'class_type':'EmptyLatentImage','inputs':{'width':1280,'height':720,'batch_size':1}},
      '6': {'class_type':'KSampler','inputs':{'model':['1',0],'seed':seed,'steps':6,'cfg':1.0,'sampler_name':'euler','scheduler':'simple','positive':['3',0],'negative':['4',0],'latent_image':['5',0],'denoise':1.0}},
      '7': {'class_type':'VAELoader','inputs':{'vae_name':VAE}},
      '8': {'class_type':'VAEDecode','inputs':{'samples':['6',0],'vae':['7',0]}},
      '9': {'class_type':'SaveImage','inputs':{'images':['8',0],'filename_prefix':prefix}}
    }
    return post_json('/prompt', {'prompt': workflow})['prompt_id'], prefix

def wait_history(prompt_id):
    for _ in range(240):
        hist = get_json('/history/' + prompt_id)
        if hist:
            return hist[prompt_id]
        time.sleep(2)
    raise TimeoutError(prompt_id)

def latest_temp(prefix):
    matches = sorted(glob.glob(f'/Users/ned/workspace/ComfyUI/output/{prefix}*.png'))
    if not matches:
        raise FileNotFoundError(prefix)
    return pathlib.Path(matches[-1])

for idx, entry in enumerate(PROMPTS, start=1):
    node = entry['node']
    target = OUTDIR / f'doomsday-{node}.png'
    if target.exists():
        print(f'SKIP {idx}/{len(PROMPTS)} {node} -> exists')
        continue
    negative = ', '.join(x for x in [BASE_NEG, entry.get('negative','').replace('\n', ' ').strip()] if x)
    prompt_id, prefix = submit(node, entry['prompt'].replace('\n', ' '), negative, 700000 + idx)
    print(f'SUBMIT {idx}/{len(PROMPTS)} {node} {prompt_id}', flush=True)
    hist = wait_history(prompt_id)
    status = hist.get('status', {}).get('status_str')
    if status != 'success':
        raise RuntimeError(f'{node}: {status}')
    src = latest_temp(prefix)
    shutil.copy2(src, target)
    print(f'DONE {idx}/{len(PROMPTS)} {node} -> {target.name}', flush=True)

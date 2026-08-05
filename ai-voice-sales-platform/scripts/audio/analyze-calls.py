import wave, glob, os, math
from array import array

FRAME_MS = 20
MIN_SPEECH_MS = 100      # need this much sound to call it speech
MIN_GAP_MS = 200         # need this much quiet to call it a gap

def pct(sorted_vals, p):
    if not sorted_vals: return 0.0
    k = (len(sorted_vals)-1) * p
    f = int(k)
    c = min(f+1, len(sorted_vals)-1)
    return sorted_vals[f] + (sorted_vals[c]-sorted_vals[f])*(k-f)

def analyse(path):
    w = wave.open(path,'rb')
    sr, n = w.getframerate(), w.getnframes()
    raw = w.readframes(n); w.close()
    s = array('h'); s.frombytes(raw)

    fs = int(sr*FRAME_MS/1000)
    nf = len(s)//fs
    rms = []
    peak = 0
    clipped = 0
    dc = sum(s)/float(len(s)) if s else 0.0
    for i in range(nf):
        acc = 0
        seg = s[i*fs:(i+1)*fs]
        for v in seg:
            acc += v*v
            av = abs(v)
            if av > peak: peak = av
            if av >= 32700: clipped += 1
        rms.append(math.sqrt(acc/fs))

    srt = sorted(rms)
    floor = pct(srt, 0.10)
    loud  = pct(srt, 0.95)
    # threshold sits between the noise floor and typical speech level
    thr = max(floor*2.5, floor+ (loud-floor)*0.15, 80.0)

    is_sp = [r > thr for r in rms]

    # smoothing: fill short gaps, drop short blips
    min_sp = max(1, MIN_SPEECH_MS//FRAME_MS)
    min_gap = max(1, MIN_GAP_MS//FRAME_MS)

    # close gaps shorter than min_gap
    i = 0
    while i < len(is_sp):
        if not is_sp[i]:
            j = i
            while j < len(is_sp) and not is_sp[j]: j += 1
            if 0 < i and j < len(is_sp) and (j-i) < min_gap:
                for k in range(i,j): is_sp[k] = True
            i = j
        else: i += 1
    # drop blips shorter than min_sp
    i = 0
    while i < len(is_sp):
        if is_sp[i]:
            j = i
            while j < len(is_sp) and is_sp[j]: j += 1
            if (j-i) < min_sp:
                for k in range(i,j): is_sp[k] = False
            i = j
        else: i += 1

    segs, gaps = [], []
    i = 0
    while i < len(is_sp):
        if is_sp[i]:
            j = i
            while j < len(is_sp) and is_sp[j]: j += 1
            segs.append((i*FRAME_MS/1000.0, j*FRAME_MS/1000.0))
            i = j
        else: i += 1
    for a,b in zip(segs, segs[1:]):
        gaps.append(round(b[0]-a[1], 2))

    dur = n/float(sr)
    sp_time = sum(b-a for a,b in segs)
    lead = segs[0][0] if segs else dur
    tail = dur - segs[-1][1] if segs else 0.0
    first_block = (segs[0][1]-segs[0][0]) if segs else 0.0

    return dict(f=os.path.basename(path), dur=dur, segs=len(segs),
                sp=sp_time, sp_pct=100.0*sp_time/dur if dur else 0,
                gaps=gaps, lead=lead, tail=tail, first=first_block,
                floor=floor, loud=loud, peak=peak, clip=clipped, dc=dc, snr_db=20*math.log10(loud/floor) if floor>0 else 0)

files = sorted(glob.glob(os.path.join(os.path.dirname(__file__),"audio","Дзвінки","*.wav")))
res = [analyse(p) for p in files]

print(f"{'file':<16}{'sec':>6}{'seg':>5}{'talk%':>7}{'lead':>6}{'1st':>6}{'tail':>6}{'maxgap':>8}{'SNRdB':>7}")
for r in res:
    mg = max(r['gaps']) if r['gaps'] else 0
    print(f"{r['f']:<16}{r['dur']:>6.1f}{r['segs']:>5}{r['sp_pct']:>7.1f}{r['lead']:>6.2f}{r['first']:>6.1f}{r['tail']:>6.2f}{mg:>8.2f}{r['snr_db']:>7.1f}")

allgaps = sorted(g for r in res for g in r['gaps'])
print("\n=== GAPS BETWEEN SPEECH SEGMENTS (all calls) ===")
print("n =", len(allgaps))
for p in (0.5,0.75,0.9,0.95,0.99):
    print(f"  p{int(p*100)}: {pct(allgaps,p):.2f}s")
print("  max:", allgaps[-1] if allgaps else 0)
buckets = [(0,0.3),(0.3,0.5),(0.5,0.7),(0.7,1.0),(1.0,1.5),(1.5,2.0),(2.0,3.0),(3.0,99)]
print("\n  distribution:")
for lo,hi in buckets:
    c = sum(1 for g in allgaps if lo <= g < hi)
    print(f"   {lo:>4.1f}-{hi:<5.1f}s  {c:>4}  {100.0*c/len(allgaps):>5.1f}%  {'#'*int(60.0*c/len(allgaps))}")

print("\n=== CALL SHAPE ===")
d = sorted(r['dur'] for r in res)
print(f"  duration  median {pct(d,0.5):.1f}s   p90 {pct(d,0.9):.1f}s   max {d[-1]:.1f}s")
fb = sorted(r['first'] for r in res)
print(f"  opening block (likely the bot greeting) median {pct(fb,0.5):.1f}s  max {fb[-1]:.1f}s")
sg = sorted(r['segs'] for r in res)
print(f"  speech segments per call: median {pct(sg,0.5):.0f}  max {sg[-1]}")
tl = sorted(r['tail'] for r in res)
print(f"  trailing silence median {pct(tl,0.5):.2f}s  max {tl[-1]:.2f}s")
sp = sorted(r['sp_pct'] for r in res)
print(f"  talk ratio median {pct(sp,0.5):.1f}%")

print("\n=== AUDIO QUALITY ===")
sn = sorted(r['snr_db'] for r in res)
print(f"  crude SNR (p95/p10 level) median {pct(sn,0.5):.1f} dB  worst {sn[0]:.1f} dB  best {sn[-1]:.1f} dB")
print(f"  clipped frames total: {sum(r['clip'] for r in res)}")
print(f"  peak amplitude max: {max(r['peak'] for r in res)} / 32767")
print(f"  DC offset max: {max(abs(r['dc']) for r in res):.1f}")

short = [r for r in res if r['segs'] <= 2]
print(f"\n  calls with <=2 speech segments (no real exchange): {len(short)} of {len(res)}")

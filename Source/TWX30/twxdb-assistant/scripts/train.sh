#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MODEL=${MODEL:-$ROOT/artifacts/base}
ITERS=${ITERS:-300}

if [ ! -f "$MODEL/config.json" ]; then
  mkdir -p "$MODEL"
  hf download mlx-community/SmolLM2-135M-Instruct --local-dir "$MODEL"
fi

mkdir -p "$ROOT/artifacts/adapters"
exec mlx_lm.lora \
  --model "$MODEL" \
  --train \
  --data "$ROOT/data" \
  --fine-tune-type lora \
  --mask-prompt \
  --num-layers -1 \
  --batch-size 8 \
  --grad-accumulation-steps 2 \
  --iters "$ITERS" \
  --learning-rate 0.0001 \
  --max-seq-length 768 \
  --steps-per-report 20 \
  --steps-per-eval 100 \
  --save-every 100 \
  --val-batches -1 \
  --test \
  --test-batches -1 \
  --seed 1731 \
  --adapter-path "$ROOT/artifacts/adapters"

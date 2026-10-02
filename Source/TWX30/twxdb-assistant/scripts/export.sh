#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MODEL=${MODEL:-$ROOT/artifacts/base}
F16="$ROOT/artifacts/twxdb-assistant-f16.gguf"
Q8="$ROOT/artifacts/twxdb-assistant-q8_0.gguf"
Q4="$ROOT/artifacts/twxdb-assistant-q4_k_m.gguf"
Q5="$ROOT/artifacts/twxdb-assistant-q5_k_m.gguf"
LLAMA_CPP_DIR=${LLAMA_CPP_DIR:-$ROOT/artifacts/llama.cpp-tools}

mkdir -p "$ROOT/artifacts/fused"
mlx_lm.fuse \
  --model "$MODEL" \
  --adapter-path "$ROOT/artifacts/adapters" \
  --save-path "$ROOT/artifacts/fused"

for file in tokenizer_config.json special_tokens_map.json vocab.json merges.txt; do
  cp "$MODEL/$file" "$ROOT/artifacts/fused/$file"
done

if [ ! -f "$LLAMA_CPP_DIR/convert_hf_to_gguf.py" ]; then
  git clone --depth 1 https://github.com/ggml-org/llama.cpp.git "$LLAMA_CPP_DIR"
fi

uv run --python 3.12 \
  --with-requirements "$LLAMA_CPP_DIR/requirements/requirements-convert_hf_to_gguf.txt" \
  python "$LLAMA_CPP_DIR/convert_hf_to_gguf.py" \
  "$ROOT/artifacts/fused" --outfile "$F16" --outtype f16

llama-quantize "$F16" "$Q8" Q8_0
llama-quantize "$F16" "$Q4" Q4_K_M
llama-quantize "$F16" "$Q5" Q5_K_M
printf '%s\n' "$F16" "$Q8" "$Q4" "$Q5"

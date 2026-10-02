# TWXDB Assistant Third-Party Notices

The distributable TWXDB Assistant payload contains these third-party works:

- **CPython 3.12**, distributed by the `python-build-standalone` project.
  CPython is licensed under the Python Software Foundation License Version 2.
  The runtime's own license files are retained in `runtime/python`.
- **llama.cpp**, build `b10090`, licensed under the MIT License. The runtime is
  obtained from the official `ggml-org/llama.cpp` GitHub release.
- **SmolLM2-135M-Instruct**, used as the base for the TWXDB query-planner
  model, licensed under the Apache License 2.0. The model-specific provenance,
  evaluation, checksum, and limitations are recorded in `MODEL_CARD.md`.

Project sources:

- <https://github.com/astral-sh/python-build-standalone>
- <https://github.com/ggml-org/llama.cpp>
- <https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct>

TWXDB Assistant itself is distributed as part of TWX30 under the terms that
apply to the TWX30 distribution.

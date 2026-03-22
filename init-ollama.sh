#!/bin/bash

if ollama list | grep -q "qwen3.5-uncensored"; then
  echo "Model already registered, skipping..."
  exit 0
fi

echo "Registering model..."
ollama create qwen3.5-uncensored -f /tmp/Modelfile
echo "Done:"
ollama list

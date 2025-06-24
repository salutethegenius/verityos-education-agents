import os
import json
import uuid
import numpy as np
import openai
import faiss
from typing import List, Dict

# Load environment vars
from dotenv import load_dotenv

load_dotenv()

EMBED_MODEL = "text-embedding-3-small"
CURRICULUM_DIR = "data/curriculum"
MEMORY_DIR = "memory"
INDEX_FILE = os.path.join(MEMORY_DIR, "curriculum_index.faiss")
META_FILE = os.path.join(MEMORY_DIR, "curriculum_metadata.jsonl")

openai.api_key = os.getenv("OPENAI_API_KEY")


# --- Helpers ---
def load_index_json(root_path: str) -> Dict[str, Dict]:
    index_path = os.path.join(root_path, "index.json")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if isinstance(data, list):
                    return {item.get("filename", ""): item for item in data}
            except json.JSONDecodeError:
                pass
    return {}


def load_text_chunks() -> List[Dict]:
    chunks = []
    for root, _, files in os.walk(CURRICULUM_DIR):
        index_meta = load_index_json(root)
        for file in files:
            if file.endswith(".txt") or file.endswith(".md"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    split_content = content.split("\n\n")
                    file_meta = index_meta.get(file, {})
                    for i, chunk in enumerate(split_content):
                        if len(chunk.strip()) > 20:
                            chunks.append({
                                "id": str(uuid.uuid4()),
                                "content": chunk.strip(),
                                "source": file_path,
                                "chunk_id": i,
                                "tags": extract_tags(file_path),
                                "type": file_meta.get("type"),
                                "grade": file_meta.get("grade"),
                                "subject": file_meta.get("subject")
                            })
    return chunks


def extract_tags(path: str) -> List[str]:
    parts = path.lower().split("/")
    tags = []
    for p in parts:
        if "grade" in p or "math" in p or "science" in p:
            tags.append(p)
    return tags


def embed_text(texts: List[str]) -> List[List[float]]:
    response = openai.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d["embedding"] for d in response.data]


# --- Main Process ---
def build_index():
    os.makedirs(MEMORY_DIR, exist_ok=True)
    chunks = load_text_chunks()
    print(f"Loaded {len(chunks)} chunks")

    embeddings = []
    metadatas = []

    for i in range(0, len(chunks), 50):
        batch = chunks[i:i + 50]
        texts = [c["content"] for c in batch]
        embs = embed_text(texts)
        embeddings.extend(embs)
        metadatas.extend(batch)

    dim = len(embeddings[0])
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings).astype("float32"))
    faiss.write_index(index, INDEX_FILE)

    with open(META_FILE, "w", encoding="utf-8") as f:
        for meta in metadatas:
            f.write(json.dumps(meta) + "\n")

    print(f"Saved index with {len(embeddings)} items")


if __name__ == "__main__":
    build_index()

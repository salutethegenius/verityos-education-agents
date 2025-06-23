# VerityOS Education Agents

🎓 **VerityOS Education Agents** is a culturally intelligent AI-powered tutoring system tailored for Bahamian students and educators. It includes specialized agents that provide tutoring, grading, research support, comprehension coaching, and homework tracking—all aligned with the Bahamas Ministry of Education curriculum.

---

## 🌴 Overview

This system is part of the **VerityOS™** sovereign AI education platform, purpose-built for small island nations and offline-friendly classrooms. It supports real-time interaction with multiple agents using localized examples, progressive feedback, and memory tracking.

This bundle is designed to simulate a responsive classroom assistant environment—with agents built to handle the full student lifecycle: tutoring, assessment, research, comprehension, task management, and teacher support.

Example use cases:
- A student uses **Sage** for math help, then submits their work to **Quill** for grading.
- A teacher assigns a reading using **Echo**, and checks class summaries via **Nassau**.
- A student doing an SBA project asks **Lucaya** to outline historical events relevant to The Bahamas.

### Included Agents

| Agent       | Role                        | Key Functions & Use Cases |
|-------------|-----------------------------|----------------------------|
| **Sage**    | AI Tutor                    | Delivers personalized explanations, practice problems, and concept reinforcement across all subjects. Ideal for 1-on-1 learning or supplemental tutoring. |
| **Quill**   | Autograder                  | Grades student assignments instantly, provides feedback, and explains rubric-based evaluations. Useful for self-assessment, teacher-assist, or automated homework review. |
| **Lucaya**  | Research Assistant          | Helps students generate outlines, summaries, citations, and structured answers using academic sources and Bahamian history. Great for essays, SBA projects, and debates. |
| **Echo**    | Comprehension Coach         | Supports reading assignments by breaking down complex texts, asking guiding questions, and testing understanding. Excellent for literacy training and passage reviews. |
| **Pineapple** | Homework Tracker          | Organizes student homework submissions, deadlines, and reminders. Helps both students and teachers keep track of assignments and missed tasks. |
| **Nassau**  | Teacher Admin Assistant     | Generates class summaries, creates schedules, manages student lists, and logs attendance. Ideal for teacher dashboards and classroom logistics. |

---

## 🚀 Getting Started

### Requirements

- Python 3.9+
- Flask
- All packages in `requirements.txt`

### Installation

```bash
pip install -r requirements.txt
```

### Run the App Locally

```bash
cd web
export FLASK_APP=app.py
flask run
```

Open your browser and visit: [http://localhost:5000](http://localhost:5000)

---

## 🧠 Agent Architecture

Each agent inherits from a shared `BaseAgent` and uses:

- **MemoryManager** – Tracks student sessions and progress
- **RAGSystem** – Retrieves relevant knowledge from embedded context
- **BahamasContext** – Applies real-world local examples
- **SafetyFilter** – Filters inappropriate or off-topic input/output

Configurations are stored in YAML per agent.

---

## 📁 Folder Structure

```
verityos-education-agents/
├── agents/            # Individual agent folders (Sage, Quill, etc.)
├── core/              # Shared agent logic and memory/RAG modules
├── utils/             # Bahamas context + safety filters
├── web/               # Flask front-end and templates
├── data/              # Context JSON and other static data
├── requirements.txt
└── README.md
```

---

## 🇧🇸 Bahamas Curriculum Integration

Aligned with:
- **BJC** (Bahamas Junior Certificate)
- **BGCSE** (Bahamas General Certificate of Secondary Education)

Includes:
- Bahamian historical and cultural references
- Localized math and science examples
- Culturally relevant study tips and guidance

---

## 📌 Status

**VerityOS™** is currently in pre-release testing. The Education Agent bundle is fully functional for private local testing. This version is stable and ready for classroom pilots.

---

## 🔐 License

All rights reserved. For private pilot testing only.

© 2025 Kenneth C. Moncur — Founder of VerityOS™ (Trademark pending)

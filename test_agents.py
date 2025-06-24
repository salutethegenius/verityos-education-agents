
#!/usr/bin/env python3
"""
Agent Testing Script for VerityOS Education Platform
Tests each agent systematically to identify bugs
"""

import sys
import traceback
from typing import Dict, List, Tuple

def test_agent_import(agent_name: str) -> Tuple[bool, str]:
    """Test if an agent can be imported successfully"""
    try:
        if agent_name == "sage":
            from agents.sage.agent import run_agent
        elif agent_name == "quill":
            from agents.quill.agent import run_agent
        elif agent_name == "echo":
            from agents.echo.agent import run_agent
        elif agent_name == "lucaya":
            from agents.lucaya.agent import run_agent
        elif agent_name == "coral":
            from agents.coral.agent import run_agent
        elif agent_name == "pineapple":
            from agents.pineapple.agent import run_agent
        else:
            return False, f"Unknown agent: {agent_name}"
        
        return True, "Import successful"
    except Exception as e:
        return False, f"Import failed: {str(e)}\n{traceback.format_exc()}"

def test_agent_basic_response(agent_name: str) -> Tuple[bool, str]:
    """Test if an agent can handle a basic greeting"""
    try:
        if agent_name == "sage":
            from agents.sage.agent import run_agent
        elif agent_name == "quill":
            from agents.quill.agent import run_agent
        elif agent_name == "echo":
            from agents.echo.agent import run_agent
        elif agent_name == "lucaya":
            from agents.lucaya.agent import run_agent
        elif agent_name == "coral":
            from agents.coral.agent import run_agent
        elif agent_name == "pineapple":
            from agents.pineapple.agent import run_agent
        else:
            return False, f"Unknown agent: {agent_name}"
        
        # Test basic greeting
        payload = {
            "session_id": "test-session",
            "user_type": "student",
            "subject": "general",
            "task": "greeting"
        }
        
        response = run_agent("Hello", payload)
        
        if response and len(response.strip()) > 0:
            return True, f"Response: {response[:100]}..."
        else:
            return False, "Empty or None response"
            
    except Exception as e:
        return False, f"Response test failed: {str(e)}\n{traceback.format_exc()}"

def run_agent_tests():
    """Run comprehensive tests on all agents"""
    agents = ["sage", "quill", "echo", "lucaya", "coral", "pineapple"]
    
    print("=" * 60)
    print("VerityOS Education Agents - Bug Testing")
    print("=" * 60)
    
    results = {}
    
    for agent in agents:
        print(f"\n🤖 Testing {agent.upper()} Agent...")
        print("-" * 40)
        
        # Test 1: Import
        print(f"1. Testing import...")
        import_success, import_msg = test_agent_import(agent)
        print(f"   {'✅ PASS' if import_success else '❌ FAIL'}: {import_msg}")
        
        results[agent] = {
            "import": import_success,
            "import_msg": import_msg,
            "response": False,
            "response_msg": "Skipped due to import failure"
        }
        
        # Test 2: Basic Response (only if import succeeded)
        if import_success:
            print(f"2. Testing basic response...")
            response_success, response_msg = test_agent_basic_response(agent)
            print(f"   {'✅ PASS' if response_success else '❌ FAIL'}: {response_msg}")
            
            results[agent]["response"] = response_success
            results[agent]["response_msg"] = response_msg
        else:
            print(f"2. Testing basic response... ⏩ SKIPPED (import failed)")
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    working_agents = []
    broken_agents = []
    
    for agent, result in results.items():
        if result["import"] and result["response"]:
            working_agents.append(agent)
            print(f"✅ {agent.upper()}: Working")
        else:
            broken_agents.append(agent)
            print(f"❌ {agent.upper()}: Has issues")
    
    print(f"\n📊 Status: {len(working_agents)}/{len(agents)} agents working")
    
    if broken_agents:
        print(f"\n🔧 Agents needing fixes: {', '.join(broken_agents)}")
        return False
    else:
        print(f"\n🎉 All agents are working correctly!")
        return True

if __name__ == "__main__":
    success = run_agent_tests()
    sys.exit(0 if success else 1)

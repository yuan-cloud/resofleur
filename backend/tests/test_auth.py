#!/usr/bin/env python3
"""
Authentication Tests for Resofleur Application
Specific test cases as requested in the review
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://livefleur.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_registration_flow():
    """Test Case 1: Registration Flow"""
    timestamp = int(time.time())
    test_email = f"test_auth_{timestamp}@test.com"
    test_password = "TestPass123!"
    
    registration_data = {
        "email": test_email,
        "password": test_password,
        "full_name": "Test User"
    }
    
    response = requests.post(
        f"{API_BASE}/auth/register",
        json=registration_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"Registration Test:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Expected: 201")
    
    if response.status_code == 201:
        data = response.json()
        required_fields = ["access_token", "refresh_token", "user"]
        has_all_fields = all(field in data for field in required_fields)
        
        print(f"  Has required fields: {has_all_fields}")
        print(f"  User ID: {data['user']['id']}")
        print(f"  ✅ PASS")
        return data, test_email, test_password
    else:
        print(f"  ❌ FAIL: {response.text}")
        return None, test_email, test_password

def test_login_flow(email, password):
    """Test Case 2: Login Flow"""
    login_data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(
        f"{API_BASE}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\nLogin Test:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Expected: 200")
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["access_token", "refresh_token", "user"]
        has_all_fields = all(field in data for field in required_fields)
        
        print(f"  Has required fields: {has_all_fields}")
        print(f"  Token type: {data.get('token_type', 'N/A')}")
        print(f"  ✅ PASS")
        return data
    else:
        print(f"  ❌ FAIL: {response.text}")
        return None

def test_invalid_login(email):
    """Test Case 3: Login with Invalid Credentials"""
    invalid_data = {
        "email": email,
        "password": "WrongPassword123!"
    }
    
    response = requests.post(
        f"{API_BASE}/auth/login",
        json=invalid_data,
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"\nInvalid Login Test:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Expected: 401")
    
    if response.status_code == 401:
        data = response.json()
        has_error_message = "Invalid credentials" in data.get("detail", "")
        
        print(f"  Has correct error message: {has_error_message}")
        print(f"  Error: {data.get('detail', 'N/A')}")
        print(f"  ✅ PASS")
        return True
    else:
        print(f"  ❌ FAIL: Expected 401, got {response.status_code}")
        return False

def test_get_user_profile(access_token):
    """Test Case 4: Get User Profile"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(
        f"{API_BASE}/auth/me",
        headers=headers,
        timeout=10
    )
    
    print(f"\nGet User Profile Test:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Expected: 200")
    
    if response.status_code == 200:
        data = response.json()
        required_fields = ["id", "email", "full_name", "is_active", "subscription_tier"]
        has_all_fields = all(field in data for field in required_fields)
        
        print(f"  Has required fields: {has_all_fields}")
        print(f"  User active: {data.get('is_active', 'N/A')}")
        print(f"  Subscription tier: {data.get('subscription_tier', 'N/A')}")
        print(f"  ✅ PASS")
        return True
    else:
        print(f"  ❌ FAIL: {response.text}")
        return False

def test_health_check():
    """Test Case 5: Health Check"""
    response = requests.get(f"{API_BASE}/health", timeout=10)
    
    print(f"\nHealth Check Test:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Expected: 200")
    
    if response.status_code == 200:
        data = response.json()
        has_ok_status = data.get("status") == "ok"
        
        print(f"  Status OK: {has_ok_status}")
        print(f"  Response: {data}")
        print(f"  ✅ PASS")
        return True
    else:
        print(f"  ❌ FAIL: {response.text}")
        return False

def main():
    """Run all test cases as specified in the review request"""
    print("🌸 Resofleur Authentication Test Suite")
    print("=" * 50)
    
    results = []
    
    # Test Case 1: Registration Flow
    reg_data, email, password = test_registration_flow()
    results.append(("Registration Flow", reg_data is not None))
    
    if reg_data:
        access_token = reg_data["access_token"]
        
        # Test Case 2: Login Flow
        login_data = test_login_flow(email, password)
        results.append(("Login Flow", login_data is not None))
        
        # Test Case 3: Invalid Login
        invalid_result = test_invalid_login(email)
        results.append(("Invalid Login", invalid_result))
        
        # Test Case 4: Get User Profile
        profile_result = test_get_user_profile(access_token)
        results.append(("Get User Profile", profile_result))
    else:
        results.extend([
            ("Login Flow", False),
            ("Invalid Login", False),
            ("Get User Profile", False)
        ])
    
    # Test Case 5: Health Check
    health_result = test_health_check()
    results.append(("Health Check", health_result))
    
    # Summary
    print(f"\n{'=' * 50}")
    print("📊 TEST RESULTS SUMMARY")
    print(f"{'=' * 50}")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nTotal Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {len(results) - passed}")
    
    if passed == len(results):
        print("\n🎉 All authentication tests passed!")
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
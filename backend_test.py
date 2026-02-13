#!/usr/bin/env python3
"""
Kolkata Job Portal Backend API Testing
Tests all backend APIs with realistic data and comprehensive scenarios
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://sme-recruit.preview.emergentagent.com/api"
headers = {"Content-Type": "application/json"}

# Test data - Using realistic Kolkata-specific data
test_data = {
    "employers": [
        {
            "phone": "9876543210",
            "role": "employer",
            "name": "Rajesh Kumar",
            "businessName": "Kumar Electronics",
            "location": "Salt Lake City",
            "languages": ["Bengali", "English", "Hindi"]
        },
        {
            "phone": "9876543211", 
            "role": "employer",
            "name": "Priya Banerjee",
            "businessName": "Banerjee Textiles",
            "location": "Park Street",
            "languages": ["Bengali", "English"]
        }
    ],
    "seekers": [
        {
            "phone": "9876543212",
            "role": "seeker", 
            "name": "Arjun Chatterjee",
            "location": "Howrah",
            "languages": ["Bengali", "Hindi", "English"],
            "skills": ["Sales", "Computer", "Communication"]
        },
        {
            "phone": "9876543213",
            "role": "seeker",
            "name": "Sneha Das", 
            "location": "Jadavpur",
            "languages": ["Bengali", "English"],
            "skills": ["Accounting", "MS Office", "Customer Service"]
        }
    ],
    "jobs": [
        {
            "title": "Sales Executive",
            "category": "Sales",
            "description": "Looking for energetic sales executive for electronics store",
            "salary": "15000-20000",
            "location": "Salt Lake City",
            "jobType": "Full-time",
            "experience": "1-2 years",
            "education": "12th Pass",
            "languages": ["Bengali", "Hindi"],
            "skills": ["Sales", "Communication"]
        },
        {
            "title": "Shop Assistant",
            "category": "Retail",
            "description": "Need assistant for textile shop, good communication required",
            "salary": "12000-15000", 
            "location": "Park Street",
            "jobType": "Full-time",
            "experience": "0-1 years",
            "education": "10th Pass",
            "languages": ["Bengali", "English"],
            "skills": ["Customer Service"]
        }
    ]
}

class JobPortalTester:
    def __init__(self):
        self.results = {}
        self.users = {}  # Store created users
        self.jobs = {}   # Store created jobs
        self.applications = {}  # Store created applications
        self.messages = {}  # Store created messages
        
    def log_result(self, test_name, success, message, response=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.results[test_name] = {
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        if response and not success:
            print(f"   Response: {response.status_code} - {response.text}")
            self.results[test_name]["response"] = {
                "status_code": response.status_code,
                "text": response.text
            }
    
    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Flow ===")
        
        # Test send OTP
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/send-otp",
                json={"phone": "9876543210"},
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result("Send OTP", True, "OTP sent successfully")
                else:
                    self.log_result("Send OTP", False, "OTP send failed", response)
            else:
                self.log_result("Send OTP", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Send OTP", False, f"Exception: {str(e)}")
        
        # Test verify OTP with correct code (123456)
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/verify-otp",
                json={"phone": "9876543210", "otp": "123456"},
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_result("Verify OTP - Valid", True, "OTP verified successfully")
                else:
                    self.log_result("Verify OTP - Valid", False, "OTP verification failed", response)
            else:
                self.log_result("Verify OTP - Valid", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Verify OTP - Valid", False, f"Exception: {str(e)}")
        
        # Test verify OTP with incorrect code
        try:
            response = requests.post(
                f"{BACKEND_URL}/auth/verify-otp", 
                json={"phone": "9876543210", "otp": "000000"},
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if not data.get("success"):
                    self.log_result("Verify OTP - Invalid", True, "Invalid OTP correctly rejected")
                else:
                    self.log_result("Verify OTP - Invalid", False, "Invalid OTP incorrectly accepted", response)
            else:
                self.log_result("Verify OTP - Invalid", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Verify OTP - Invalid", False, f"Exception: {str(e)}")
    
    def test_user_management(self):
        """Test user creation and management"""
        print("\n=== Testing User Management ===")
        
        # Create employers
        for i, employer_data in enumerate(test_data["employers"]):
            try:
                response = requests.post(
                    f"{BACKEND_URL}/users",
                    json=employer_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    user = response.json()
                    if user.get("id"):
                        self.users[f"employer_{i}"] = user
                        self.log_result(f"Create Employer {i+1}", True, f"Employer {user['name']} created successfully")
                    else:
                        self.log_result(f"Create Employer {i+1}", False, "No user ID returned", response)
                else:
                    self.log_result(f"Create Employer {i+1}", False, f"HTTP {response.status_code}", response)
            except Exception as e:
                self.log_result(f"Create Employer {i+1}", False, f"Exception: {str(e)}")
        
        # Create seekers
        for i, seeker_data in enumerate(test_data["seekers"]):
            try:
                response = requests.post(
                    f"{BACKEND_URL}/users",
                    json=seeker_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    user = response.json()
                    if user.get("id"):
                        self.users[f"seeker_{i}"] = user
                        self.log_result(f"Create Seeker {i+1}", True, f"Seeker {user['name']} created successfully")
                    else:
                        self.log_result(f"Create Seeker {i+1}", False, "No user ID returned", response)
                else:
                    self.log_result(f"Create Seeker {i+1}", False, f"HTTP {response.status_code}", response)
            except Exception as e:
                self.log_result(f"Create Seeker {i+1}", False, f"Exception: {str(e)}")
        
        # Test get user details
        if "employer_0" in self.users:
            try:
                user_id = self.users["employer_0"]["id"]
                response = requests.get(f"{BACKEND_URL}/users/{user_id}", headers=headers)
                
                if response.status_code == 200:
                    user = response.json()
                    if user.get("name") == self.users["employer_0"]["name"]:
                        self.log_result("Get User Details", True, "User details retrieved correctly")
                    else:
                        self.log_result("Get User Details", False, "User details mismatch", response)
                else:
                    self.log_result("Get User Details", False, f"HTTP {response.status_code}", response)
            except Exception as e:
                self.log_result("Get User Details", False, f"Exception: {str(e)}")
    
    def test_job_posting(self):
        """Test job posting and free job limits"""
        print("\n=== Testing Job Posting ===")
        
        if "employer_0" not in self.users:
            self.log_result("Job Posting", False, "No employer available for testing")
            return
        
        employer = self.users["employer_0"]
        employer_id = employer["id"]
        
        # Test creating first free job
        try:
            job_data = test_data["jobs"][0]
            response = requests.post(
                f"{BACKEND_URL}/jobs",
                json=job_data,
                params={"employer_id": employer_id},
                headers=headers
            )
            
            if response.status_code == 200:
                job = response.json()
                if job.get("id"):
                    self.jobs["job_0"] = job
                    self.log_result("Create Job 1 (Free)", True, f"Job '{job['title']}' created successfully")
                else:
                    self.log_result("Create Job 1 (Free)", False, "No job ID returned", response)
            else:
                self.log_result("Create Job 1 (Free)", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Create Job 1 (Free)", False, f"Exception: {str(e)}")
        
        # Test creating second free job  
        try:
            job_data = test_data["jobs"][1]
            response = requests.post(
                f"{BACKEND_URL}/jobs",
                json=job_data,
                params={"employer_id": employer_id},
                headers=headers
            )
            
            if response.status_code == 200:
                job = response.json()
                if job.get("id"):
                    self.jobs["job_1"] = job
                    self.log_result("Create Job 2 (Free)", True, f"Job '{job['title']}' created successfully")
                else:
                    self.log_result("Create Job 2 (Free)", False, "No job ID returned", response)
            else:
                self.log_result("Create Job 2 (Free)", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Create Job 2 (Free)", False, f"Exception: {str(e)}")
        
        # Test creating third job (should require payment)
        try:
            job_data = {
                "title": "Store Manager",
                "category": "Management", 
                "description": "Need experienced manager for retail store",
                "salary": "25000-30000",
                "location": "Esplanade",
                "jobType": "Full-time",
                "experience": "3-5 years",
                "education": "Graduate",
                "languages": ["Bengali", "English"],
                "skills": ["Management", "Leadership"]
            }
            
            response = requests.post(
                f"{BACKEND_URL}/jobs",
                json=job_data,
                params={"employer_id": employer_id},
                headers=headers
            )
            
            if response.status_code == 402:  # Payment required
                self.log_result("Create Job 3 (Payment Required)", True, "Payment requirement correctly enforced")
            elif response.status_code == 200:
                self.log_result("Create Job 3 (Payment Required)", False, "Payment requirement not enforced", response)
            else:
                self.log_result("Create Job 3 (Payment Required)", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Create Job 3 (Payment Required)", False, f"Exception: {str(e)}")
    
    def test_job_search(self):
        """Test job search and filtering"""
        print("\n=== Testing Job Search ===")
        
        # Test get all jobs
        try:
            response = requests.get(f"{BACKEND_URL}/jobs", headers=headers)
            
            if response.status_code == 200:
                jobs = response.json()
                if isinstance(jobs, list) and len(jobs) > 0:
                    self.log_result("Get All Jobs", True, f"Retrieved {len(jobs)} jobs")
                else:
                    self.log_result("Get All Jobs", False, "No jobs returned or invalid format", response)
            else:
                self.log_result("Get All Jobs", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Get All Jobs", False, f"Exception: {str(e)}")
        
        # Test search by category
        try:
            response = requests.get(
                f"{BACKEND_URL}/jobs",
                params={"category": "Sales"},
                headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                sales_jobs = [job for job in jobs if job.get("category") == "Sales"]
                if len(sales_jobs) > 0:
                    self.log_result("Search by Category", True, f"Found {len(sales_jobs)} sales jobs")
                else:
                    self.log_result("Search by Category", False, "No sales jobs found", response)
            else:
                self.log_result("Search by Category", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Search by Category", False, f"Exception: {str(e)}")
        
        # Test search by location
        try:
            response = requests.get(
                f"{BACKEND_URL}/jobs",
                params={"location": "Salt Lake"},
                headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                if len(jobs) > 0:
                    self.log_result("Search by Location", True, f"Found {len(jobs)} jobs in Salt Lake area")
                else:
                    self.log_result("Search by Location", False, "No jobs found in Salt Lake area", response)
            else:
                self.log_result("Search by Location", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Search by Location", False, f"Exception: {str(e)}")
        
        # Test search by job type
        try:
            response = requests.get(
                f"{BACKEND_URL}/jobs",
                params={"jobType": "Full-time"},
                headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                if len(jobs) > 0:
                    self.log_result("Search by Job Type", True, f"Found {len(jobs)} full-time jobs")
                else:
                    self.log_result("Search by Job Type", False, "No full-time jobs found", response)
            else:
                self.log_result("Search by Job Type", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Search by Job Type", False, f"Exception: {str(e)}")
        
        # Test search by language
        try:
            response = requests.get(
                f"{BACKEND_URL}/jobs",
                params={"language": "Bengali"},
                headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                if len(jobs) > 0:
                    self.log_result("Search by Language", True, f"Found {len(jobs)} jobs requiring Bengali")
                else:
                    self.log_result("Search by Language", False, "No jobs requiring Bengali found", response)
            else:
                self.log_result("Search by Language", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Search by Language", False, f"Exception: {str(e)}")
        
        # Test search by skill
        try:
            response = requests.get(
                f"{BACKEND_URL}/jobs",
                params={"skill": "Sales"},
                headers=headers
            )
            
            if response.status_code == 200:
                jobs = response.json()
                if len(jobs) > 0:
                    self.log_result("Search by Skill", True, f"Found {len(jobs)} jobs requiring sales skills")
                else:
                    self.log_result("Search by Skill", False, "No jobs requiring sales skills found", response)
            else:
                self.log_result("Search by Skill", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Search by Skill", False, f"Exception: {str(e)}")
    
    def test_applications(self):
        """Test job applications"""
        print("\n=== Testing Applications ===")
        
        if "seeker_0" not in self.users or "job_0" not in self.jobs:
            self.log_result("Applications", False, "No seeker or job available for testing")
            return
        
        seeker = self.users["seeker_0"] 
        job = self.jobs["job_0"]
        
        # Test applying to job
        try:
            application_data = {
                "jobId": job["id"],
                "coverLetter": "I am very interested in this sales position and have good communication skills in Bengali and Hindi."
            }
            
            response = requests.post(
                f"{BACKEND_URL}/applications",
                json=application_data,
                params={"seeker_id": seeker["id"]},
                headers=headers
            )
            
            if response.status_code == 200:
                application = response.json()
                if application.get("id"):
                    self.applications["app_0"] = application
                    self.log_result("Apply to Job", True, f"Application submitted successfully")
                else:
                    self.log_result("Apply to Job", False, "No application ID returned", response)
            else:
                self.log_result("Apply to Job", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Apply to Job", False, f"Exception: {str(e)}")
        
        # Test duplicate application (should fail)
        try:
            application_data = {
                "jobId": job["id"],
                "coverLetter": "Trying to apply again"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/applications",
                json=application_data,
                params={"seeker_id": seeker["id"]},
                headers=headers
            )
            
            if response.status_code == 400:  # Bad request for duplicate
                self.log_result("Duplicate Application Prevention", True, "Duplicate application correctly rejected")
            elif response.status_code == 200:
                self.log_result("Duplicate Application Prevention", False, "Duplicate application incorrectly allowed", response)
            else:
                self.log_result("Duplicate Application Prevention", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Duplicate Application Prevention", False, f"Exception: {str(e)}")
        
        # Test get job applications
        try:
            response = requests.get(f"{BACKEND_URL}/applications/job/{job['id']}", headers=headers)
            
            if response.status_code == 200:
                applications = response.json()
                if isinstance(applications, list) and len(applications) > 0:
                    self.log_result("Get Job Applications", True, f"Retrieved {len(applications)} applications for job")
                else:
                    self.log_result("Get Job Applications", False, "No applications found for job", response)
            else:
                self.log_result("Get Job Applications", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Get Job Applications", False, f"Exception: {str(e)}")
        
        # Test get seeker applications
        try:
            response = requests.get(f"{BACKEND_URL}/applications/seeker/{seeker['id']}", headers=headers)
            
            if response.status_code == 200:
                applications = response.json()
                if isinstance(applications, list) and len(applications) > 0:
                    self.log_result("Get Seeker Applications", True, f"Retrieved {len(applications)} applications for seeker")
                else:
                    self.log_result("Get Seeker Applications", False, "No applications found for seeker", response)
            else:
                self.log_result("Get Seeker Applications", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Get Seeker Applications", False, f"Exception: {str(e)}")
        
        # Test update application status
        if "app_0" in self.applications:
            try:
                response = requests.put(
                    f"{BACKEND_URL}/applications/{self.applications['app_0']['id']}/status",
                    params={"status": "shortlisted"},
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success"):
                        self.log_result("Update Application Status", True, "Application status updated to shortlisted")
                    else:
                        self.log_result("Update Application Status", False, "Status update failed", response)
                else:
                    self.log_result("Update Application Status", False, f"HTTP {response.status_code}", response)
            except Exception as e:
                self.log_result("Update Application Status", False, f"Exception: {str(e)}")
    
    def test_messaging(self):
        """Test messaging functionality"""
        print("\n=== Testing Messaging ===")
        
        if "employer_0" not in self.users or "seeker_0" not in self.users or "job_0" not in self.jobs:
            self.log_result("Messaging", False, "Insufficient data for messaging test")
            return
        
        employer = self.users["employer_0"]
        seeker = self.users["seeker_0"] 
        job = self.jobs["job_0"]
        
        # Test sending message from employer to seeker
        try:
            message_data = {
                "receiverId": seeker["id"],
                "jobId": job["id"],
                "message": "Hello! I saw your application for the sales position. Can we schedule an interview?"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/messages",
                json=message_data,
                params={"sender_id": employer["id"]},
                headers=headers
            )
            
            if response.status_code == 200:
                message = response.json()
                if message.get("id"):
                    self.messages["msg_0"] = message
                    self.log_result("Send Message (Employer to Seeker)", True, "Message sent successfully")
                else:
                    self.log_result("Send Message (Employer to Seeker)", False, "No message ID returned", response)
            else:
                self.log_result("Send Message (Employer to Seeker)", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Send Message (Employer to Seeker)", False, f"Exception: {str(e)}")
        
        # Test sending reply from seeker to employer
        try:
            message_data = {
                "receiverId": employer["id"],
                "jobId": job["id"],
                "message": "Thank you for your interest! I am available for interview anytime this week."
            }
            
            response = requests.post(
                f"{BACKEND_URL}/messages",
                json=message_data,
                params={"sender_id": seeker["id"]},
                headers=headers
            )
            
            if response.status_code == 200:
                message = response.json()
                if message.get("id"):
                    self.messages["msg_1"] = message
                    self.log_result("Send Message (Seeker to Employer)", True, "Reply sent successfully")
                else:
                    self.log_result("Send Message (Seeker to Employer)", False, "No message ID returned", response)
            else:
                self.log_result("Send Message (Seeker to Employer)", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Send Message (Seeker to Employer)", False, f"Exception: {str(e)}")
        
        # Test get messages between users
        try:
            response = requests.get(
                f"{BACKEND_URL}/messages/{employer['id']}",
                params={"other_user_id": seeker["id"]},
                headers=headers
            )
            
            if response.status_code == 200:
                messages = response.json()
                if isinstance(messages, list) and len(messages) >= 2:
                    self.log_result("Get Messages", True, f"Retrieved {len(messages)} messages between users")
                else:
                    self.log_result("Get Messages", False, f"Expected at least 2 messages, got {len(messages) if isinstance(messages, list) else 'invalid response'}", response)
            else:
                self.log_result("Get Messages", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Get Messages", False, f"Exception: {str(e)}")
        
        # Test get conversations
        try:
            response = requests.get(f"{BACKEND_URL}/messages/conversations/{employer['id']}", headers=headers)
            
            if response.status_code == 200:
                conversations = response.json()
                if isinstance(conversations, list) and len(conversations) > 0:
                    self.log_result("Get Conversations", True, f"Retrieved {len(conversations)} conversations")
                else:
                    self.log_result("Get Conversations", False, "No conversations found", response)
            else:
                self.log_result("Get Conversations", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Get Conversations", False, f"Exception: {str(e)}")
    
    def test_payments(self):
        """Test payment functionality"""
        print("\n=== Testing Payments ===")
        
        if "employer_0" not in self.users:
            self.log_result("Payments", False, "No employer available for payment testing")
            return
        
        employer = self.users["employer_0"]
        
        # Test create payment order
        try:
            order_data = {
                "amount": 5000  # ₹50 in paise
            }
            
            response = requests.post(
                f"{BACKEND_URL}/payments/create-order",
                json=order_data,
                params={"employer_id": employer["id"]},
                headers=headers
            )
            
            if response.status_code == 200:
                order = response.json()
                if order.get("id") and order.get("amount") == 5000:
                    self.log_result("Create Payment Order", True, f"Payment order created: {order['id']}")
                    
                    # Test verify payment (demo)
                    try:
                        payment_data = {
                            "razorpayOrderId": order["id"],
                            "razorpayPaymentId": "pay_demo_12345",
                            "razorpaySignature": "demo_signature_12345"
                        }
                        
                        response = requests.post(
                            f"{BACKEND_URL}/payments/verify",
                            json=payment_data,
                            params={"employer_id": employer["id"]},
                            headers=headers
                        )
                        
                        if response.status_code == 200:
                            result = response.json()
                            if result.get("success"):
                                self.log_result("Verify Payment", True, "Payment verified successfully (demo)")
                            else:
                                self.log_result("Verify Payment", False, "Payment verification failed", response)
                        else:
                            self.log_result("Verify Payment", False, f"HTTP {response.status_code}", response)
                    except Exception as e:
                        self.log_result("Verify Payment", False, f"Exception: {str(e)}")
                        
                else:
                    self.log_result("Create Payment Order", False, "Invalid order response", response)
            else:
                self.log_result("Create Payment Order", False, f"HTTP {response.status_code}", response)
        except Exception as e:
            self.log_result("Create Payment Order", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Kolkata Job Portal Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("="*60)
        
        # Run tests in order
        self.test_auth_flow()
        self.test_user_management()
        self.test_job_posting()
        self.test_job_search()
        self.test_applications()
        self.test_messaging()
        self.test_payments()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST RESULTS SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.results.values() if result["success"])
        failed = len(self.results) - passed
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"📈 SUCCESS RATE: {(passed/len(self.results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for test_name, result in self.results.items():
                if not result["success"]:
                    print(f"   • {test_name}: {result['message']}")
        
        return self.results

if __name__ == "__main__":
    tester = JobPortalTester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open("/app/test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to /app/test_results.json")
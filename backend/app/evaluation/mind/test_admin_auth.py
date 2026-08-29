import sys
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.models.user_model import users_collection
from app.services.user_service import create_user
from app.utils.jwt_helper import generate_token

app = create_app()
app.config['TESTING'] = True
client = app.test_client()

# 1. Normal User Test
norm_user = users_collection.find_one({'role': 'user'})
if not norm_user:
    norm_user = users_collection.find_one()

norm_token = generate_token(norm_user)
r_norm = client.get('/admin/dashboard', headers={'Authorization': f'Bearer {norm_token}'})

print(f"Normal User Status Code: {r_norm.status_code} (Expected 403)")
print(f"Normal User Response   : {r_norm.get_json()}")
assert r_norm.status_code == 403, "Normal user was not blocked!"

# 2. Admin User Test
admin_user = users_collection.find_one({'role': 'admin'})
if not admin_user:
    users_collection.update_one({'_id': norm_user['_id']}, {'$set': {'role': 'admin'}})
    admin_user = users_collection.find_one({'role': 'admin'})

admin_token = generate_token(admin_user)
r_admin = client.get('/admin/dashboard', headers={'Authorization': f'Bearer {admin_token}'})

res_json = r_admin.get_json()
print(f"Admin User Status Code : {r_admin.status_code} (Expected 200)")
print(f"Admin User Response    : success = {res_json.get('success')}")
assert r_admin.status_code == 200, "Admin user failed to access dashboard!"
print("PASSED: Admin Dashboard Authentication & Authorization Verification!")

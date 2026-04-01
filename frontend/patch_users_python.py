import re

file_path = '/home/prince/Documents/yasian-dev/work-report-system/backend/app/api/users.py'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix read_users to order alphabetically and remove duplicate router.get
content = re.sub(
    r'@router\.get\("/", response_model=List\[UserRead\]\)\n@router\.get\("/", response_model=List\[UserRead\]\)\ndef read_users\(db: Session = Depends\(get_db\), current_user: User = Depends\(get_current_hr_or_admin_user\)\):\n    users = db\.query\(User\)\.all\(\)',
    r'@router.get("/", response_model=List[UserRead])\ndef read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):\n    users = db.query(User).order_by(User.name.asc()).all()',
    content
)

# Also in case it only has one @router.get (although grep showed two)
content = re.sub(
    r'def read_users\(db: Session = Depends\(get_db\), current_user: User = Depends\(get_current_hr_or_admin_user\)\):\n    users = db\.query\(User\)\.all\(\)',
    r'def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_hr_or_admin_user)):\n    users = db.query(User).order_by(User.name.asc()).all()',
    content
)


# 2. Allow HR to perform management actions.
# Replace get_current_admin_user with get_current_hr_or_admin_user on management endpoints.
# Create:
content = content.replace(
    'Depends(get_current_admin_user)',
    'Depends(get_current_hr_or_admin_user)'
)

# 3. Add get_current_hr_or_admin_user to imports if not already there, wait, users.py imports it?
# Let's check imports in next step

with open(file_path, 'w') as f:
    f.write(content)

print('Done')

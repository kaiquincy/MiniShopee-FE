import os

# Duyệt qua thư mục hiện tại ('.') và tất cả thư mục con
for root, dirs, files in os.walk('.'):
    for file in files:
        # In đường dẫn đầy đủ của file
        print(os.path.join(root, file))
import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# Add project directory to Python path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uncommitted_quiz.settings')
application = get_wsgi_application()

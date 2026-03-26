from app.db.database import SessionLocal
from app.db.init_db import init_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db = SessionLocal()
    try:
        logger.info("Creating initial data")
        init_db(db)
        logger.info("Initial data created")
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()

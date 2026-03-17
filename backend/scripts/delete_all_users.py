"""
Elimina tutti gli utenti dal database (cascade su hotel, competitor, alert).
Uso: cd backend && python scripts/delete_all_users.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import text
from app.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT email FROM users"))
        users = result.fetchall()
        if not users:
            print("Nessun utente trovato.")
            return
        print(f"Utenti trovati: {[u[0] for u in users]}")
        confirm = input("Confermi l'eliminazione? [s/N] ").strip().lower()
        if confirm != "s":
            print("Annullato.")
            return
        await db.execute(text("DELETE FROM users"))
        await db.commit()
        print(f"Eliminati {len(users)} utenti.")


asyncio.run(main())

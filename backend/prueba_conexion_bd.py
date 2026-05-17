# test_db.py (no lo necesitas guardar, solo para probar)
from config import obtener_conexion

try:
    conexion = obtener_conexion()
    print("Conexión exitosa a la base de datos")
    conexion.close()
except Exception as e:
    print("Error:", e)
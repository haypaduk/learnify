# ============================================
# ARCHIVO 2/10: CONFIGURACIÓN DE BASE DE DATOS
# ============================================
# Este archivo maneja la conexión a MySQL
# Usa el nombre de BD que elegiste: learnify_db
# ============================================

import mysql.connector

def obtener_conexion():
    """
    Crea y devuelve una conexión a la base de datos MySQL
    """
    conexion = mysql.connector.connect(
        host="localhost",      # XAMPP corre en localhost
        user="root",           # Usuario por defecto de XAMPP
        password="",           # XAMPP normalmente no tiene contraseña
        database="learnify_db"  # El nombre que le pusiste a tu BD
    )
    return conexion

# ============================================
# NOTA: Si tu XAMPP tiene contraseña, cámbiala arriba
# Si usas otro puerto, agrega: port=3307 (o el que uses)
# ============================================
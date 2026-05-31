# ============================================
# ARCHIVO 4/10: SERVIDOR PRINCIPAL (PARTE 1)
# ============================================
# Este archivo es el corazón del backend
# Ahora usando MONGODB en lugar de MySQL
# ============================================

# ============================================
# IMPORTAR LIBRERÍAS NECESARIAS
# ============================================
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import hashlib  # Para encriptar contraseñas (ya no se usa, pero lo dejamos)
from mongo_config import get_mongo_connection  # Nuestra conexión a MongoDB
from bson import ObjectId  # Para manejar IDs de MongoDB
import os
from werkzeug.utils import secure_filename
import gridfs  # Para guardar archivos en MongoDB
from datetime import datetime

# ============================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================
app = Flask(__name__, 
            static_folder='../frontend',  # Carpeta con nuestros HTML
            static_url_path='')            # Sirve archivos desde la raíz

# Permitir conexiones desde el frontend (importante para fetch)
CORS(app)

# ============================================
# CONEXIÓN A MONGODB Y GRIDFS
# ============================================
db = get_mongo_connection()
fs = gridfs.GridFS(db)  # Para guardar archivos

# Helper para convertir ObjectId a string en respuestas JSON
def convertir_objectid(documento):
    """Convierte los ObjectId de MongoDB a string para JSON (incluyendo listas y documentos anidados)"""
    if documento is None:
        return None
    
    if isinstance(documento, list):
        return [convertir_objectid(item) for item in documento]
    
    if isinstance(documento, dict):
        nuevo_doc = {}
        for key, value in documento.items():
            if isinstance(value, ObjectId):
                nuevo_doc[key] = str(value)
            elif isinstance(value, list):
                nuevo_doc[key] = [convertir_objectid(item) for item in value]
            elif isinstance(value, dict):
                nuevo_doc[key] = convertir_objectid(value)
            else:
                nuevo_doc[key] = value
        return nuevo_doc
    
    return documento

# ============================================
# RUTA DE PRUEBA (para verificar que el servidor funciona)
# ============================================
@app.route('/api/test', methods=['GET'])
def test():
    """
    Ruta simple para probar que el servidor responde
    """
    return jsonify({
        "mensaje": "Servidor funcionando correctamente",
        "estado": "ok",
        "base_datos": "MongoDB"
    })


# ============================================
# ARCHIVO 5/10: SERVIDOR PRINCIPAL (PARTE 2)
# ============================================
# AGREGAR ESTE CÓDIGO DESPUÉS DE LA RUTA DE PRUEBA (/api/test)
# ============================================

# ============================================
# API: REGISTRO DE USUARIOS
# ============================================
@app.route('/api/registro', methods=['POST'])
def registrar_usuario():
    """
    Recibe datos del formulario de registro y guarda en MongoDB
    """
    try:
        # 1. Obtener datos que envía el frontend (en formato JSON)
        datos = request.json
        nombre = datos['nombre']
        email = datos['email']
        password = datos['password']
        rol = datos['rol']
        
        # 2. Verificar si el email ya existe
        if db.usuarios.find_one({"email": email}):
            return jsonify({
                "exito": False,
                "mensaje": "El email ya está registrado"
            }), 400
        
        # 3. Guardar en MongoDB (contraseña en texto plano como solicitaste)
        nuevo_usuario = {
            "nombre": nombre,
            "email": email,
            "password": password,  # Texto plano
            "rol": rol,
            "fecha_registro": datetime.now()
        }
        
        resultado = db.usuarios.insert_one(nuevo_usuario)
        
        # 4. Respuesta exitosa
        return jsonify({
            "exito": True,
            "mensaje": "Usuario registrado correctamente",
            "usuario_id": str(resultado.inserted_id)
        })
        
    except Exception as error:
        # 5. Si hay error, lo devolvemos al frontend
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400

# ============================================
# API: INICIAR SESIÓN
# ============================================
@app.route('/api/iniciar-sesion', methods=['POST'])
def iniciar_sesion():
    """
    Verifica credenciales y devuelve datos del usuario
    """
    try:
        datos = request.json
        email = datos['email']
        password = datos['password']

        # Buscar usuario en MongoDB
        usuario = db.usuarios.find_one({"email": email})
        
        if usuario and usuario['password'] == password:
            # Convertir ObjectId a string
            usuario['_id'] = str(usuario['_id'])
            # No enviar la contraseña al frontend
            del usuario['password']

            return jsonify({
                "exito": True,
                "mensaje": "Login exitoso",
                "usuario": usuario
            })
        else:
            return jsonify({
                "exito": False,
                "mensaje": "Email o contraseña incorrectos"
            }), 401

    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400


# ============================================
# ARCHIVO 12/20: API DE EQUIPOS
# ============================================

# ============================================
# API: CREAR EQUIPO (todos pueden crear equipos)
# ============================================
@app.route('/api/equipos/crear', methods=['POST'])
def crear_equipo():
    """
    Crea un nuevo equipo
    Cualquier usuario puede crear equipos
    Recibe: nombre, descripcion, lider_id (el usuario que lo crea)
    """
    try:
        datos = request.json
        nombre = datos.get('nombre')
        descripcion = datos.get('descripcion', '')
        lider_id = datos.get('lider_id')
        
        # Validar campos obligatorios
        if not nombre or not lider_id:
            return jsonify({
                "exito": False,
                "mensaje": "Nombre y líder son obligatorios"
            }), 400
        
        # Verificar que el líder existe
        lider = db.usuarios.find_one({"_id": ObjectId(lider_id)})
        if not lider:
            return jsonify({
                "exito": False,
                "mensaje": "El líder no existe"
            }), 404
        
        # Crear el equipo
        nuevo_equipo = {
            "nombre": nombre,
            "descripcion": descripcion,
            "lider_id": ObjectId(lider_id),
            "fecha_creacion": datetime.now(),
            "miembros": []  # Lista de IDs de miembros
        }
        
        resultado = db.equipos.insert_one(nuevo_equipo)
        
        return jsonify({
            "exito": True,
            "mensaje": "Equipo creado correctamente",
            "equipo_id": str(resultado.inserted_id)
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400

# ============================================
# API: LISTAR EQUIPOS (según rol del usuario)
# ============================================
@app.route('/api/equipos/<string:usuario_id>', methods=['GET'])
def listar_equipos(usuario_id):
    """
    Devuelve los equipos según el rol:
    - Si es maestro: sus equipos creados
    - Si es alumno: los equipos donde es miembro O líder
    """
    try:
        # Verificar el rol del usuario
        usuario = db.usuarios.find_one({"_id": ObjectId(usuario_id)})
        
        if not usuario:
            return jsonify({"exito": False, "mensaje": "Usuario no encontrado"}), 404
        
        equipos = []
        
        if usuario['rol'] == 'maestro':
            cursor = db.equipos.find({"lider_id": ObjectId(usuario_id)})
        else:
            cursor = db.equipos.find({
                "$or": [
                    {"lider_id": ObjectId(usuario_id)},
                    {"miembros": ObjectId(usuario_id)}
                ]
            })
        
        for equipo in cursor:
            # Convertir manualmente todos los ObjectId a string
            equipo_data = {
                "_id": str(equipo["_id"]),
                "nombre": equipo["nombre"],
                "descripcion": equipo.get("descripcion", ""),
                "lider_id": str(equipo["lider_id"]),
                "fecha_creacion": equipo["fecha_creacion"],
                "total_miembros": len(equipo.get("miembros", [])),
                "miembros": [str(m) for m in equipo.get("miembros", [])]
            }
            
            # Obtener nombre del líder
            lider = db.usuarios.find_one({"_id": ObjectId(equipo_data["lider_id"])})
            equipo_data["lider_nombre"] = lider["nombre"] if lider else "Desconocido"
            
            equipos.append(equipo_data)
        
        return jsonify({
            "exito": True,
            "equipos": equipos
        })
        
    except Exception as error:
        print(f"Error en listar_equipos: {error}")
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400

# ============================================
# API: UNIRSE A EQUIPO (solo alumnos)
# ============================================
@app.route('/api/equipos/unirse', methods=['POST'])
def unirse_equipo():
    """
    Un alumno se une a un equipo
    Recibe: equipo_id, usuario_id
    """
    try:
        datos = request.json
        equipo_id = datos.get('equipo_id')
        usuario_id = datos.get('usuario_id')
        
        if not equipo_id or not usuario_id:
            return jsonify({
                "exito": False,
                "mensaje": "Equipo y usuario son obligatorios"
            }), 400
        
        # Verificar si ya es miembro
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        if not equipo:
            return jsonify({
                "exito": False,
                "mensaje": "El equipo no existe"
            }), 404
        
        if ObjectId(usuario_id) in equipo.get('miembros', []):
            return jsonify({
                "exito": False,
                "mensaje": "Ya eres miembro de este equipo"
            }), 400
        
        # Unirse al equipo
        db.equipos.update_one(
            {"_id": ObjectId(equipo_id)},
            {"$push": {"miembros": ObjectId(usuario_id)}}
        )
        
        return jsonify({
            "exito": True,
            "mensaje": "Te has unido al equipo correctamente"
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400


# ============================================
# API: VER DETALLE DE UN EQUIPO
# ============================================
@app.route('/api/equipos/detalle/<string:equipo_id>', methods=['GET'])
def detalle_equipo(equipo_id):
    """
    Devuelve la información completa de un equipo:
    - Datos del equipo
    - Lista de miembros
    - Información del líder
    """
    try:
        # Obtener datos del equipo
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        
        if not equipo:
            return jsonify({"exito": False, "mensaje": "Equipo no encontrado"}), 404
        
        # Obtener información del líder
        lider = db.usuarios.find_one({"_id": equipo["lider_id"]})
        
        # Obtener miembros
        miembros = []
        for miembro_id in equipo.get('miembros', []):
            miembro = db.usuarios.find_one({"_id": miembro_id})
            if miembro:
                miembros.append({
                    "id": str(miembro["_id"]),
                    "nombre": miembro["nombre"],
                    "email": miembro["email"]
                })
        
        equipo = convertir_objectid(equipo)
        
        return jsonify({
            "exito": True,
            "equipo": {
                "id": equipo["_id"],
                "nombre": equipo["nombre"],
                "descripcion": equipo["descripcion"],
                "lider_id": str(equipo["lider_id"]),
                "lider_nombre": lider["nombre"] if lider else "Desconocido",
                "fecha_creacion": equipo["fecha_creacion"],
                "total_miembros": len(miembros),
                "miembros": miembros
            }
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400


# ============================================
# API: ELIMINAR EQUIPO
# Solo el líder del equipo puede eliminarlo
# ============================================
@app.route('/api/equipos/eliminar/<string:equipo_id>', methods=['DELETE'])
def eliminar_equipo(equipo_id):
    """
    Elimina un equipo y todos sus miembros
    Solo el líder del equipo puede hacerlo
    """
    try:
        datos = request.json
        usuario_id = datos.get('usuario_id')
        
        if not usuario_id:
            return jsonify({
                "exito": False,
                "mensaje": "Usuario no identificado"
            }), 400
        
        # Verificar que el usuario es el líder del equipo
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        
        if not equipo:
            return jsonify({
                "exito": False,
                "mensaje": "El equipo no existe"
            }), 404
        
        if str(equipo["lider_id"]) != usuario_id:
            return jsonify({
                "exito": False,
                "mensaje": "No tienes permiso para eliminar este equipo"
            }), 403
        
        # Eliminar el equipo
        db.equipos.delete_one({"_id": ObjectId(equipo_id)})
        
        return jsonify({
            "exito": True,
            "mensaje": "Equipo eliminado correctamente"
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400


# ============================================
# API: SALIR DEL EQUIPO (solo para miembros, no líderes)
# ============================================
@app.route('/api/equipos/salir/<string:equipo_id>', methods=['DELETE'])
def salir_del_equipo(equipo_id):
    """
    Permite a un usuario salir de un equipo
    No puede salir si es el líder
    """
    try:
        datos = request.json
        usuario_id = datos.get('usuario_id')
        
        if not usuario_id:
            return jsonify({
                "exito": False,
                "mensaje": "Usuario no identificado"
            }), 400
        
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        
        if not equipo:
            return jsonify({
                "exito": False,
                "mensaje": "El equipo no existe"
            }), 404
        
        # Verificar que no es el líder
        if str(equipo["lider_id"]) == usuario_id:
            return jsonify({
                "exito": False,
                "mensaje": "Eres el líder del equipo. No puedes salir, solo eliminarlo."
            }), 403
        
        # Verificar que es miembro
        if ObjectId(usuario_id) not in equipo.get('miembros', []):
            return jsonify({
                "exito": False,
                "mensaje": "No eres miembro de este equipo"
            }), 404
        
        # Eliminar al usuario de la lista de miembros
        db.equipos.update_one(
            {"_id": ObjectId(equipo_id)},
            {"$pull": {"miembros": ObjectId(usuario_id)}}
        )
        
        return jsonify({
            "exito": True,
            "mensaje": "Has salido del equipo correctamente"
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400


# ============================================
# ARCHIVO 19/30: API DE TAREAS
# ============================================

# ============================================
# API: CREAR TAREA
# ============================================
@app.route('/api/tareas/crear', methods=['POST'])
def crear_tarea():
    """
    Crea una nueva tarea en un equipo
    Solo el líder del equipo puede crear tareas
    """
    try:
        datos = request.json
        titulo = datos.get('titulo')
        descripcion = datos.get('descripcion', '')
        equipo_id = datos.get('equipo_id')
        creador_id = datos.get('creador_id')
        fecha_limite = datos.get('fecha_limite')
        
        if not titulo or not equipo_id or not creador_id:
            return jsonify({
                "exito": False,
                "mensaje": "Título, equipo y creador son obligatorios"
            }), 400
        
        # Verificar que el creador es el líder del equipo
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        
        if not equipo:
            return jsonify({
                "exito": False,
                "mensaje": "El equipo no existe"
            }), 404
        
        if str(equipo["lider_id"]) != creador_id:
            return jsonify({
                "exito": False,
                "mensaje": "Solo el líder del equipo puede crear tareas"
            }), 403
        
        # Convertir fecha límite
        fecha_limite_obj = None
        if fecha_limite:
            fecha_limite_obj = datetime.strptime(fecha_limite, '%Y-%m-%d')
        
        # Crear tarea
        nueva_tarea = {
            "titulo": titulo,
            "descripcion": descripcion,
            "equipo_id": ObjectId(equipo_id),
            "creador_id": ObjectId(creador_id),
            "fecha_limite": fecha_limite_obj,
            "fecha_creacion": datetime.now(),
            "archivos_adjuntos": []  # Para archivos que suba el maestro
        }
        
        resultado = db.tareas.insert_one(nueva_tarea)
        
        return jsonify({
            "exito": True,
            "mensaje": "Tarea creada correctamente",
            "tarea_id": str(resultado.inserted_id)
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400


# ============================================
# API: LISTAR TAREAS DE UN EQUIPO
# ============================================
@app.route('/api/tareas/equipo/<string:equipo_id>', methods=['GET'])
def listar_tareas_equipo(equipo_id):
    """
    Devuelve todas las tareas de un equipo
    """
    try:
        # Primero obtener el equipo para saber quién es el líder
        equipo = db.equipos.find_one({"_id": ObjectId(equipo_id)})
        lider_id = str(equipo["lider_id"]) if equipo else None
        
        cursor = db.tareas.find({"equipo_id": ObjectId(equipo_id)})
        
        tareas = []
        for tarea in cursor:
            # Convertir tarea manualmente
            tarea_data = {
                "_id": str(tarea["_id"]),
                "titulo": tarea["titulo"],
                "descripcion": tarea.get("descripcion", ""),
                "equipo_id": str(tarea["equipo_id"]),
                "creador_id": str(tarea["creador_id"]),
                "fecha_limite": tarea.get("fecha_limite"),
                "fecha_creacion": tarea["fecha_creacion"],
                "lider_id": lider_id  # ← NUEVO: ID del líder del equipo
            }
            
            # Obtener nombre del creador
            creador = db.usuarios.find_one({"_id": tarea["creador_id"]})
            tarea_data["creador_nombre"] = creador["nombre"] if creador else "Desconocido"
            
            # Obtener nombre del equipo
            equipo_nombre = db.equipos.find_one({"_id": tarea["equipo_id"]})
            tarea_data["equipo_nombre"] = equipo_nombre["nombre"] if equipo_nombre else "Desconocido"
            
            # Contar entregas
            tarea_data["total_entregas"] = db.entregas.count_documents({"tarea_id": ObjectId(tarea["_id"])})
            
            tareas.append(tarea_data)
        
        # Ordenar por fecha límite
        tareas.sort(key=lambda x: x.get('fecha_limite') or datetime.max)
        
        return jsonify({
            "exito": True,
            "tareas": tareas
        })
        
    except Exception as error:
        print(f"Error en listar_tareas_equipo: {error}")
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400
    
# ============================================
# API: DETALLE DE UNA TAREA
# ============================================
@app.route('/api/tareas/detalle/<string:tarea_id>', methods=['GET'])
def detalle_tarea(tarea_id):
    """
    Devuelve información completa de una tarea y sus entregas
    """
    try:
        tarea = db.tareas.find_one({"_id": ObjectId(tarea_id)})
        
        if not tarea:
            return jsonify({
                "exito": False,
                "mensaje": "Tarea no encontrada"
            }), 404
        
        # Obtener el equipo para saber quién es el líder
        equipo = db.equipos.find_one({"_id": tarea["equipo_id"]})
        
        # Convertir tarea manualmente
        tarea_data = {
            "_id": str(tarea["_id"]),
            "titulo": tarea["titulo"],
            "descripcion": tarea.get("descripcion", ""),
            "equipo_id": str(tarea["equipo_id"]),
            "creador_id": str(tarea["creador_id"]),
            "fecha_limite": tarea.get("fecha_limite"),
            "fecha_creacion": tarea["fecha_creacion"],
            "lider_id": str(equipo["lider_id"]) if equipo else None  # ← NUEVO: ID del líder del equipo
        }
        
        # Obtener nombre del creador
        creador = db.usuarios.find_one({"_id": tarea["creador_id"]})
        tarea_data["creador_nombre"] = creador["nombre"] if creador else "Desconocido"
        
        # Obtener nombre del equipo
        tarea_data["equipo_nombre"] = equipo["nombre"] if equipo else "Desconocido"
        
        # Obtener entregas
        entregas = []
        cursor = db.entregas.find({"tarea_id": ObjectId(tarea_id)})
        for entrega in cursor:
            entrega_data = {
                "_id": str(entrega["_id"]),
                "tarea_id": str(entrega["tarea_id"]),
                "alumno_id": str(entrega["alumno_id"]),
                "comentario": entrega.get("comentario", ""),
                "archivo_id": str(entrega["archivo_id"]) if entrega.get("archivo_id") else None,
                "nombre_archivo": entrega.get("nombre_archivo"),
                "calificacion": entrega.get("calificacion"),
                "fecha_entrega": entrega["fecha_entrega"]
            }
            
            # Obtener nombre del alumno
            alumno = db.usuarios.find_one({"_id": entrega["alumno_id"]})
            entrega_data["alumno_nombre"] = alumno["nombre"] if alumno else "Desconocido"
            
            entregas.append(entrega_data)
        
        tarea_data["entregas"] = entregas
        
        return jsonify({
            "exito": True,
            "tarea": tarea_data
        })
        
    except Exception as error:
        print(f"Error en detalle_tarea: {error}")
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400
    
# ============================================
# API: ENTREGAR TAREA (con GridFS para archivos)
# ============================================
@app.route('/api/entregas/subir', methods=['POST'])
def subir_archivo_entrega():
    """Sube un archivo para una entrega usando GridFS de MongoDB"""
    try:
        tarea_id = request.form.get('tarea_id')
        alumno_id = request.form.get('alumno_id')
        comentario = request.form.get('comentario', '')
        
        if not tarea_id or not alumno_id:
            return jsonify({"exito": False, "mensaje": "Faltan datos"}), 400
        
        # Verificar si ya entregó
        entrega_existente = db.entregas.find_one({
            "tarea_id": ObjectId(tarea_id),
            "alumno_id": ObjectId(alumno_id)
        })
        
        if entrega_existente:
            return jsonify({"exito": False, "mensaje": "Ya entregaste esta tarea"}), 400
        
        # Procesar archivo con GridFS
        archivo = request.files.get('archivo')
        archivo_id = None
        nombre_archivo = None
        
        if archivo:
            nombre_archivo = secure_filename(archivo.filename)
            # Guardar en GridFS
            archivo_id = fs.put(
                archivo.read(),
                filename=nombre_archivo,
                content_type=archivo.content_type
            )
        
        # Crear entrega
        nueva_entrega = {
            "tarea_id": ObjectId(tarea_id),
            "alumno_id": ObjectId(alumno_id),
            "comentario": comentario,
            "archivo_id": archivo_id,  # ID del archivo en GridFS
            "nombre_archivo": nombre_archivo,
            "calificacion": None,
            "fecha_entrega": datetime.now()
        }
        
        db.entregas.insert_one(nueva_entrega)
        
        return jsonify({
            "exito": True,
            "mensaje": "Tarea entregada con éxito"
        })
        
    except Exception as error:
        return jsonify({"exito": False, "mensaje": str(error)}), 400


# ============================================
# API: CALIFICAR ENTREGA
# ============================================
@app.route('/api/entregas/calificar', methods=['PUT'])
def calificar_entrega():
    """
    Permite al líder del equipo calificar una entrega
    """
    try:
        datos = request.json
        entrega_id = datos.get('entrega_id')
        calificacion = datos.get('calificacion')
        
        if not entrega_id or calificacion is None:
            return jsonify({
                "exito": False,
                "mensaje": "ID de entrega y calificación son obligatorios"
            }), 400
        
        if calificacion < 0 or calificacion > 100:
            return jsonify({
                "exito": False,
                "mensaje": "La calificación debe estar entre 0 y 100"
            }), 400
        
        # Actualizar calificación
        db.entregas.update_one(
            {"_id": ObjectId(entrega_id)},
            {"$set": {"calificacion": calificacion}}
        )
        
        return jsonify({
            "exito": True,
            "mensaje": "Calificación guardada"
        })
        
    except Exception as error:
        return jsonify({
            "exito": False,
            "mensaje": f"Error: {str(error)}"
        }), 400


# ============================================
# API: TAREAS PENDIENTES DEL ALUMNO (para dashboard)
# ============================================
@app.route('/api/tareas/alumno/<string:alumno_id>', methods=['GET'])
def tareas_alumno(alumno_id):
    """
    Devuelve las tareas pendientes de un alumno
    """
    try:
        # Obtener equipos donde el alumno es miembro o líder
        equipos = db.equipos.find({
            "$or": [
                {"lider_id": ObjectId(alumno_id)},
                {"miembros": ObjectId(alumno_id)}
            ]
        })
        
        equipos_ids = [equipo["_id"] for equipo in equipos]
        
        if not equipos_ids:
            return jsonify({"exito": True, "tareas": []})
        
        # Obtener tareas de esos equipos que el alumno no ha entregado
        tareas_pendientes = []
        entregas_realizadas = [e["tarea_id"] for e in db.entregas.find({"alumno_id": ObjectId(alumno_id)})]
        
        cursor = db.tareas.find({
            "equipo_id": {"$in": equipos_ids},
            "_id": {"$nin": entregas_realizadas}
        })
        
        for tarea in cursor:
            # Obtener el equipo para saber quién es el líder
            equipo = db.equipos.find_one({"_id": tarea["equipo_id"]})
            
            tarea_data = {
                "_id": str(tarea["_id"]),
                "titulo": tarea["titulo"],
                "descripcion": tarea.get("descripcion", ""),
                "equipo_id": str(tarea["equipo_id"]),
                "creador_id": str(tarea["creador_id"]),
                "fecha_limite": tarea.get("fecha_limite"),
                "fecha_creacion": tarea["fecha_creacion"],
                "lider_id": str(equipo["lider_id"]) if equipo else None,  # ← NUEVO
                "equipo_nombre": equipo["nombre"] if equipo else "Desconocido"
            }
            
            tareas_pendientes.append(tarea_data)
        
        return jsonify({
            "exito": True,
            "tareas": tareas_pendientes
        })
        
    except Exception as error:
        print(f"Error en tareas_alumno: {error}")
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400
    
# ============================================
# API: TAREAS RECIENTES DEL LÍDER (para dashboard)
# ============================================
@app.route('/api/tareas/lider/<string:lider_id>', methods=['GET'])
def tareas_lider(lider_id):
    """
    Devuelve las tareas de los equipos que lidera un usuario
    """
    try:
        # Obtener equipos donde es líder
        equipos = db.equipos.find({"lider_id": ObjectId(lider_id)})
        equipos_ids = [equipo["_id"] for equipo in equipos]
        
        tareas = []
        cursor = db.tareas.find({"equipo_id": {"$in": equipos_ids}}).sort("fecha_creacion", -1).limit(10)
        
        for tarea in cursor:
            # Convertir manualmente
            tarea_data = {
                "_id": str(tarea["_id"]),
                "titulo": tarea["titulo"],
                "descripcion": tarea.get("descripcion", ""),
                "equipo_id": str(tarea["equipo_id"]),
                "creador_id": str(tarea["creador_id"]),
                "fecha_limite": tarea.get("fecha_limite"),
                "fecha_creacion": tarea["fecha_creacion"],
                "total_entregas": db.entregas.count_documents({"tarea_id": tarea["_id"]})
            }
            
            equipo = db.equipos.find_one({"_id": tarea["equipo_id"]})
            tarea_data["equipo_nombre"] = equipo["nombre"] if equipo else "Desconocido"
            
            tareas.append(tarea_data)
        
        return jsonify({
            "exito": True,
            "tareas": tareas
        })
        
    except Exception as error:
        print(f"Error en tareas_lider: {error}")
        return jsonify({
            "exito": False,
            "mensaje": str(error)
        }), 400

# ============================================
# API: CHAT DEL EQUIPO
# ============================================

# Obtener mensajes de un equipo
@app.route('/api/chat/<string:equipo_id>', methods=['GET'])
def obtener_mensajes(equipo_id):
    """Devuelve todos los mensajes de un equipo"""
    try:
        # Convertir equipo_id a ObjectId
        from bson import ObjectId
        equipo_obj_id = ObjectId(equipo_id)
        
        cursor = db.mensajes_chat.find({"equipo_id": equipo_obj_id}).sort("fecha_envio", 1).limit(100)
        
        mensajes = []
        for msg in cursor:
            # Convertir ObjectId a string
            msg['_id'] = str(msg['_id'])
            msg['equipo_id'] = str(msg['equipo_id'])
            msg['usuario_id'] = str(msg['usuario_id'])
            
            # Obtener información del usuario
            usuario = db.usuarios.find_one({"_id": ObjectId(msg['usuario_id'])})
            msg['usuario_nombre'] = usuario['nombre'] if usuario else "Desconocido"
            msg['rol'] = usuario['rol'] if usuario else "alumno"
            
            mensajes.append(msg)
        
        return jsonify({
            "exito": True,
            "mensajes": mensajes
        })
        
    except Exception as error:
        print(f"Error en obtener_mensajes: {error}")
        return jsonify({"exito": False, "mensaje": str(error)}), 400

# Enviar mensaje a un equipo
@app.route('/api/chat/enviar', methods=['POST'])
def enviar_mensaje():
    """Guarda un mensaje en el chat del equipo"""
    try:
        datos = request.json
        equipo_id = datos.get('equipo_id')
        usuario_id = datos.get('usuario_id')
        mensaje_texto = datos.get('mensaje', '').strip()
        
        if not mensaje_texto:
            return jsonify({"exito": False, "mensaje": "El mensaje no puede estar vacío"}), 400
        
        from bson import ObjectId
        
        nuevo_mensaje = {
            "equipo_id": ObjectId(equipo_id),
            "usuario_id": ObjectId(usuario_id),
            "mensaje": mensaje_texto,
            "fecha_envio": datetime.now()
        }
        
        db.mensajes_chat.insert_one(nuevo_mensaje)
        
        return jsonify({
            "exito": True,
            "mensaje": "Mensaje enviado"
        })
        
    except Exception as error:
        print(f"Error en enviar_mensaje: {error}")
        return jsonify({"exito": False, "mensaje": str(error)}), 400

# ============================================
# RUTA PARA SERVIR ARCHIVOS DESDE GRIDFS
# ============================================
@app.route('/api/archivos/<string:archivo_id>')
def servir_archivo_gridfs(archivo_id):
    """Sirve archivos almacenados en GridFS"""
    try:
        archivo = fs.get(ObjectId(archivo_id))
        from flask import Response
        return Response(archivo.read(), mimetype=archivo.content_type)
    except Exception as error:
        return jsonify({"error": "Archivo no encontrado"}), 404


# ============================================
# NOTA: El servidor se reinicia automáticamente
# cuando guardas el archivo (por el debug=True)
# ============================================

# ============================================
# INICIAR SERVIDOR (solo cuando ejecutamos este archivo)
# ============================================
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 SERVIDOR INICIADO CON MONGODB")
    print("="*50)
    print("📁 Base de datos: MongoDB")
    print("📁 Archivos: GridFS")
    print("🌐 Rutas disponibles:")
    print("   • http://localhost:5000/api/test  (para probar)")
    print("\n🔧 Presiona CTRL+C para detener el servidor")
    print("="*50 + "\n")
    
    # Usar use_reloader=False para evitar errores de socket en Windows
    app.run(debug=True, use_reloader=False, port=5000)
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import Usuario from "../models/Usuarios.js"
import { generarJWT, generarId } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
import csurf from "csurf";

const formularioLogin = (req, res) => {
    res.render("auth/login", {
        autenticado: true,
        tituloPagina: "Inicio de Sesión",
        csrfToken: req.csrfToken()
    });
};

const formularioRegistro = (req, res) => {
    console.log(req.csrfToken())
    res.render("auth/register", {
        tituloPagina: "Formulario de Registro",
        csrfToken: req.csrfToken()
    });
}

const registrar = async(req, res) => {
    //Validaciones
    await check("nombre")
        .notEmpty()
        .withMessage("El nombre no puede estar vacio")
        .run(req)

    await check("email")
        .isEmail()
        .withMessage("Ingrese un correo valido")
        .run(req)

    await check("password")
        .isLength({ min: 6})
        .withMessage("La contraseña debe tener minimo 6 caracteres")
        .run(req)

    await check("repeat_password")
        .equals(req.body.password)
        .withMessage("La contraseña no es igual")
        .run(req)
    
    // Verificar que el resultado no este vacio
    let resultado = validationResult(req)
    console.log(resultado.array())

    if(!resultado.isEmpty()) {
        // Errores
        return res.render("auth/register", {
            tituloPagina: "Formulario de Registro",
            errores: resultado.array(),
            csrfToken: req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    // Extraer datos
    const {nombre, email, password } = req.body

    //Validar si el correo existe
    const existeUsuario = await Usuario.findOne({where: {email}})
    if (existeUsuario){
        return res.render("auth/register", {
            tituloPagina: "Formulario de Registro",
            csrfToken: req.csrfToken(),
            errores: [{ msg: "El usuario ya existe"}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Este es el comando que crea la cuenta
    const usuarios = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId(),
    })

    res.render("templates/mensaje" , {
        tituloPagina: "Cuenta creada",
        mensaje: "La cuenta ha sido creada, Verifica tu correo para validar la cuenta!"
    })

    // Enviar correo
    emailRegistro({
        nombre: usuarios.nombre,
        email: usuarios.email,
        token: usuarios.token
    })
    
}

const confirmar= async(req,res) => {
    const {token} = req.params
    console.log(token)

    //Validar el token si existe
    const usuario = await Usuario.findOne({where: {token}})
    console.log(usuario)

    // Confirmar la cuenta
    if(!usuario) {
        return res.render("auth/confirmar",{
            tituloPagina: "Cuenta confirmada",
            mensaje: "Hubo un error al confirmar la cuenta",
            error: true
        })
    }

    // Valida la informacion y lo manda a DB.

    usuario.token = null
    usuario.confirmado = true

    await usuario.save()

    res.render("auth/confirmar", {
        tituloPagina: "Cuenta confirmada",
        mensaje: "La cuenta se confirmo"
    })
}

const formularioOlvidePassword = (req, res) => {
    res.render("auth/forgot-password", {
        tituloPagina: "Olvide la contraseña",
        csrfToken: req.csrfToken()
    });
}

const resetPassword = async(req, res) => {

    // Validacion 
    await check("email")
        .isEmail()
        .withMessage("Esto no parece un correo")
        .run(req)
    
    let resultado = validationResult(req)

    // Verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render("auth/forgot-password", {
            tituloPagina: "Olvido la contraseña",
            errores: resultado.array(),
            csrfToken: req.csrfToken()
        })
    }

    // Buscar el usuario

    const {email} = req.body

    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario) {
        return res.render("auth/forgot-password", {
            tituloPagina: "Recuperar contraseña",
            csrfToken: req.csrfToken(),
            errores: [{msg: "El email no existe"}]
        })
    }

    // Generar token y enviar un email
    usuario.token = generarId()
    await usuario.save()

    // Enviar el correo
    emailOlvidePassword({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    // Mostrar mensaje
    res.render("templates/mensaje", {
        tituloPagina: "Restablecer la contraseña",
        mensaje: "Hemos enviado un correo electronico para restablecer"
    })

}

const comprobarToken = async(req, res) => {
    const {token} = req.params

    // Validar si el token
    const usuario = await Usuario.findOne({where: {token}})

    if(!usuario){
        return res.render("auth/confirmar", {
            tituloPagina: "Restablecer contraseña",
            mensaje: "Hubo un error al validar el token",
            error: true
        })
    }

    // Mandar el formulario para restablecer
    res.render("auth/reset-password", {
        tituloPagina: "Escribe tu nueva contraseña",
        csrfToken: req.csrfToken()
    })
}

const nuevaPassword = async(req, res) => {
    //Validaciones
    await check("password")
        .isLength({ min: 6})
        .withMessage("La contraseña debe tener minimo 6 caracteres")
        .run(req)

    await check("repeat_password")
        .equals(req.body.password)
        .withMessage("La contraseña no es igual")
        .run(req)

    let resultado = validationResult(req)

    //Validar que este vacio
    if(!resultado.isEmpty()){
        // Errores
        return res.render("auth/reset-password", {
            tituloPagina: "Restablecer Contraseña",
            csrfToken: req.csrfToken(), 
            errores: resultado.array()
        })
    }

    const {token} = req.params
    const {password} = req.body

    // Identificar el usuario para hacer el cambio 
    const usuario = await Usuario.findOne({where: {token}})

    // Hash la nueva password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null 

    // Guardar en la DB
    await usuario.save()

    res.render("auth/confirmar",{
        tituloPagina: "Contraseña restablecida",
        srfToken: req.csrfToken(),
        mensaje: "La contraseña se cambio correctamente!"
    })
}

const autenticar = async(req,res) => {
    //Validaciones
    await check("email")
        .isEmail()
        .withMessage("El correo es obligatorio")
        .run(req)

    await check("password")
        .notEmpty()
        .withMessage("La contraseña no puede estar vacia")
        .run(req)

    let resultado = validationResult(req)

    // verificar que el resultado este vacio
    if(!resultado.isEmpty()) {
        // Errores
        return res.render("auth/login", {
            tituloPagina: "Iniciar Sesión",
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {email, password} = req.body

    // Comprobar si existe
    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render("auth/login", {
            tituloPagina: "Iniciar Sesion",
            csrfToken: req.csrfToken(),
            errores: [{msg: "El usuario no existe"}]

        })
    }

    // Comprobar si el usuario esta confirmado (TRUE) --> 1 en la DB
    if(!usuario.confirmado) {
        return res.render("auth/login", {
            tituloPagina: "Iniciar Sesion",
            csrfToken: req.csrfToken(),
            errores: [{msg: "El usuario no esta confirmado"}]

        })
    }

    // Comprobar la contraseña
    if(!usuario.verificarPassword(password)){
        return res.render("auth/login", {
            tituloPagina: "Iniciar Sesion",
            csrfToken: req.csrfToken(),
            errores: [{msg: "Contraseña incorrecta!"}]

        })
    }

    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
    //console.log(token)
     
    // Almacenar la Cookie
    return res
        .cookie("_token", token, {
            httpOnly: true,
            // secure: true,
            // sameSite: true
        })
        .redirect("/mis-propiedades")


}

export { formularioLogin, registrar, confirmar, formularioRegistro, resetPassword, formularioOlvidePassword, comprobarToken, nuevaPassword, autenticar}
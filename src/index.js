const express = require("express");
const mysql = require("mysql");

const app = express();

app.use(express.json());

const now = new Date;

app.post("/account", function(re, res) 
{
    const conn = mysql.createConnection({host:"localhost", database:"nodejs_db", user:"root", password:""});
    var {name, password, cpf} = re.body;

    function insertAccount() 
    {
        var actionCreate = [{action: "Conta criada", date: now.getDate() + '/' + now.getMonth() + '/' + now.getFullYear(), hour: now.getHours() + ':' + now.getMinutes()}];
        conn.query("INSERT INTO tb_users (name, password, cpf, extrato) VALUES (?, ?, ?, ?)", [name, password, cpf, JSON.stringify(actionCreate)], function(err, result) 
        {

            if(err) throw err
            conn.end();
            res.json({response: "Usuário cadastrado com sucesso!"});

        });
    }

    function checkCPF() 
    {

        conn.query("SELECT * FROM tb_users WHERE cpf = ?", [cpf], function(err, result) 
        {

            if(err) throw err

            if(result.length > 0) 
            {
                conn.end();
                res.json({error: "CPF ja cadastrado"});
            } else {
                insertAccount();
            }

        })

    }

    if (cpf.length > 11 || cpf.length < 11) 
    {
        res.json({error: "CPF Invalido!"});
    }

    if (cpf.length == 11) 
    {

        conn.connect(function(err) 
        {

            if(err) throw err
            console.log("connected!");
            checkCPF()

        })

    }

});

app.get("/extrato/:cpf", function(re, res) 
{

    const conn = mysql.createConnection({host:"localhost", database:"nodejs_db", user:"root", password:""});
    var params = re.params;
    var cpf = params.cpf;

    conn.connect(function(err) 
    {

        if(err) throw err
        console.log("connected");

        conn.query("SELECT * FROM tb_users WHERE cpf = ?", [cpf], function(err, result) 
        {

            if(err) throw err
            conn.end();
            if (result.length > 0) 
            {
                var info = 
                {
                    nome: result[0].name,
                    cpf: result[0].cpf,
                    saldo: result[0].saldo,
                    extrato: JSON.parse(result[0].extrato)
                }
                res.json(info);
            } else {
                res.json({error: "Conta inválida!"});
            }

        });

    });

});

app.post("/deposit", function(re, res) 
{

    const conn = mysql.createConnection({host:"localhost", database:"nodejs_db", user:"root", password:""});
    const {cpf, deposit} = re.body;
    var account;

    conn.connect(function(err) 
    {
        if (err) throw err

        conn.query("SELECT * FROM tb_users WHERE cpf=?", [cpf], function(err, result) 
        {
            if(err) throw err;
            if(result.length > 0) 
            {
                account = result[0];
                var oldActions = JSON.parse(account.extrato)
                var newAction = {action: "Depósito", value: deposit, hourDeposit: now.getHours + ':' + now.getMinutes};
                var newExtract = [];
                var totalValueAccount = parseInt(account.saldo) + parseInt(deposit);
                oldActions.forEach(function(item, index) 
                {
                    newExtract.push(oldActions[index]);
                });
                newExtract.push(newAction);
                console.log(newExtract);

                conn.query("UPDATE tb_users SET saldo=? WHERE cpf=?", [parseInt(totalValueAccount), account.cpf], function(err, result) 
                {
                    if(err) throw err;

                    conn.query("UPDATE tb_users SET extrato=? WHERE cpf=?", [JSON.stringify(newExtract), account.cpf], function(err, result) 
                    {
                        if(err) throw err;
                        conn.end();

                        console.log("SUCESSO");
                    });

                    res.json({sucess: "Valor depositado com sucesso!", valorAnterior: account.saldo, valorAtual: totalValueAccount});
                });
            }
            if(result.length == 0) 
            {
                conn.end();
                res.json({error: "CPF não encontrado!!"});
            }
        });

    });

});

app.listen(3333);
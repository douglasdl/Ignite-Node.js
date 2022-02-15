const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(express.json());

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;
    const customer = customers.find(customer => customer.cpf === cpf);
    if (!customer) {
        return response.status(400).json({"error": "Customer not found"});
    }
    request.customer = customer;
    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((accumulator, operation) => {
        if (operation.type === 'credit') {
            return accumulator + operation.amount;
        } else {
            return accumulator - operation.amount;
        }
    }, 0);

    return balance;
}


/**
 * Create an account
 * @param {string} cpf
 * @param {string} name
 * @param {uuid} id
 * @param {array} statement
 */ 
app.post('/account', (request, response) => {
    const { cpf, name } = request.body;
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    ); 

    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer already exists' });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });
    return response.status(201).send();
});


//app.use(verifyIfExistsAccountCPF);

/**
 * Get the customer statement
 */
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
});

/**
 * Deposit money
 */
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;
    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation);
    return response.status(201).send(); 
});

/**
 * Withdraw money
 */
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: "Insuficient funds!"})
    }

    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation);
});

/**
 * Get the customer statement by date
 */
 app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat).toDateString());

    return response.json(statement);
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
})

app.listen(3333);
const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaStatic = require('koa-static');
const path = require('path');
const uuid = require('uuid');

const app = new Koa();

let subscriptions = []; 

const public = path.join(__dirname, '/public');

app.use(koaStatic(public))


app.use(koaBody({
    urlencoded: true,
    multipart: true,
})) 

app.use((ctx, next) => {
    if(ctx.request.method !== 'OPTIONS'){
        next();

        return;
    }

    ctx.response.set('Access-Control-Allow-Origin', '*');
    ctx.response.set('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH, GET, POST');

    ctx.response.status = 204;
})

// Добавление файла на сервер 
app.use((ctx, next) => {
    if(ctx.request.method !== 'POST' || ctx.request.url !== '/upload'){
        next();

        return;
    }

    ctx.response.set('Access-Control-Allow-Origin', '*');
    
    let fileName;

    try {
        const { file } = ctx.request.files;

        const subfolder = uuid.v4(); // генерация id папки

        const uploadFolder = public + '/' + subfolder; // генерация пути к папке в отдельную переменную

        fs.mkdirSync(uploadFolder); // создание папки

        fs.copyFileSync(file.filepath, uploadFolder + '/' + file.originalFilename);
        // копирование файла из временной папки в папку public на сервере

        fileName = subfolder + '/' + file.originalFilename; 
    } catch (error) {
        ctx.response.status = 500;

        return;
    }

    ctx.response.body = fileName;
})

// Удаление подписки
app.use((ctx, next) => {
    if(ctx.request.method !== 'DELETE'){
        next();

        return;
    }

    const { phone } = ctx.request.query;

    ctx.response.set('Access-Control-Allow-Origin', '*');

    if(subscriptions.every(sub => sub.phone !== phone)) {
    // если все телефоны не равны телефону, который нужно удалить из подписок
        ctx.response.status = 400;
        // то отправить статус ответа - ошибка
        ctx.response.body = 'subscripiton doesn\'t exists'
        // отправить тело ответа 

        return;
    }

    subscriptions = subscriptions.filter(sub => sub.phone !== phone);
    // удалить  подписку
    
    ctx.response.body = 'OK';

    next();
})

// Добавление новой подписки 
app.use((ctx, next) => {
    if(ctx.request.method !== 'POST'){
        next();

        return;
    }

    const { name, phone } = ctx.request.body;

    ctx.response.set('Access-Control-Allow-Origin', '*');

    if(subscriptions.some(sub => sub.phone === phone)) {
    // если телефон уже есть в подписках
        ctx.response.status = 400;
        // то отправить статус ответа - ошибка
        ctx.response.body = 'subscripiton exists'
        // отправить тело ответа 

        return;
    }

    subscriptions.push({ name, phone });
    // добавить подписку
    
    ctx.response.body = 'OK';

    next();
})

const server = http.createServer(app.callback());

const port = 7070;

server.listen(port, (err) => {
    if(err){
        console.log(err)

        return // прекращение дальнейших действий 
    }

    console.log('Server is listening to ' + port); // выполняется если сервер запущен
})
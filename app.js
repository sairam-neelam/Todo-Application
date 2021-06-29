const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbItemToResponsiveItem = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//GET todo
app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //Scenario 3
    case hasPriorityAndStatus(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodosQuery = `
                SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbItemToResponsiveItem(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario 5
    case hasCategoryAndStatus(request.query):
      if (category == "WORK" || category == "LEARNING" || category == "HOME") {
        if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
          getTodosQuery = `
                SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbItemToResponsiveItem(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 7
    case hasCategoryAndPriority(request.query):
      if (category == "WORK" || category == "LEARNING" || category == "HOME") {
        if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
          getTodosQuery = `
                SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbItemToResponsiveItem(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 1
    case hasStatus(request.query):
      if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
        getTodosQuery = `
                SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDbItemToResponsiveItem(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Scenario 2
    case hasPriority(request.query):
      if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
        getTodosQuery = `
                SELECT * FROM todo WHERE priority = '${priority}';`;
        console.log(1);
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDbItemToResponsiveItem(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Scenario 6
    case hasCategory(request.query):
      if (category == "WORK" || category == "LEARNING" || category == "HOME") {
        getTodosQuery = `
            SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDbItemToResponsiveItem(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Scenario 4
    default:
      getTodosQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((each) => convertDbItemToResponsiveItem(each)));
  }
});

//API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  data = await db.get(getTodoQuery);
  response.send(convertDbItemToResponsiveItem(data));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    getTodoQuery = `
        SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const result = await db.all(getTodoQuery);
    response.send(result.map((each) => convertDbItemToResponsiveItem(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
    if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
      if (category == "WORK" || category == "LEARNING" || category == "HOME") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                    INSERT INTO
                        todo (id, todo, priority, status, category, due_date)
                    VALUES 
                        (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let requestBody = request.body;;

  if (requestBody.priority !== undefined) {
    updateColumn = "Priority";
  } else if (requestBody.status !== undefined) {
    updateColumn = "Status";
  } else if (requestBody.category !== undefined) {
    updateColumn = "Category";
  } else if (requestBody.dueDate !== undefined) {
    updateColumn = "Due Date";
  } else if (requestBody.todo !== undefined) {
    updateColumn = "Todo";
  }

  const previousTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;

  const previousTodo = await db.get(previousTodoQuery);

  let {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  console.log(previousTodo);
  console.log(request.body);

  if (priority == "HIGH" || priority == "MEDIUM" || priority == "LOW") {
    if (status == "TO DO" || status == "IN PROGRESS" || status == "DONE") {
      if (category == "WORK" || category == "LEARNING" || category == "HOME") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          console.log(dueDate);
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const updateTodoQuery = `
                    UPDATE todo
                    SET
                        todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}',
                        due_date = '${newDate}'
                    WHERE 
                        id = ${todoId}`;
          await db.run(updateTodoQuery);
          response.send(`${updateColumn} Updated`);
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//DELETE todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM
        todo
    WHERE 
        id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;

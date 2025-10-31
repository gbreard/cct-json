import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Configurar cliente de DynamoDB
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Crear cliente de documentos (facilita trabajar con objetos JS)
// Con removeUndefinedValues para evitar errores con valores undefined
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Nombre de la tabla
export const TABLE_NAME = "cct-editor-data";

// Funciones helper para operaciones comunes
export async function putItem(pk: string, sk: string, data: any) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk,
      sk,
      ...data,
    },
  });
  return await docClient.send(command);
}

export async function getItem(pk: string, sk: string) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk },
  });
  const result = await docClient.send(command);
  return result.Item;
}

export async function deleteItem(pk: string, sk: string) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { pk, sk },
  });
  return await docClient.send(command);
}

export async function scanByPrefix(prefix: string) {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(pk, :prefix)",
    ExpressionAttributeValues: {
      ":prefix": prefix,
    },
  });
  const result = await docClient.send(command);
  return result.Items || [];
}

import { initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";
import { prisma } from "@waas/database";

export async function usePostgresAuthState(instanceId: string) {
  // 1. Get or create creds
  const credsRow = await prisma.baileysAuth.findUnique({
    where: {
      instanceId_key: {
        instanceId,
        key: "creds"
      }
    }
  });

  let creds: any;
  if (credsRow) {
    try {
      creds = JSON.parse(credsRow.value, BufferJSON.reviver);
    } catch {
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
    await prisma.baileysAuth.create({
      data: {
        instanceId,
        key: "creds",
        value: JSON.stringify(creds, BufferJSON.replacer)
      }
    });
  }

  const saveCreds = async () => {
    await prisma.baileysAuth.upsert({
      where: {
        instanceId_key: {
          instanceId,
          key: "creds"
        }
      },
      create: {
        instanceId,
        key: "creds",
        value: JSON.stringify(creds, BufferJSON.replacer)
      },
      update: {
        value: JSON.stringify(creds, BufferJSON.replacer)
      }
    });
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: { [id: string]: any } = {};
          
          const dbKeys = ids.map(id => `${type}:${id}`);
          const rows = await prisma.baileysAuth.findMany({
            where: {
              instanceId,
              key: { in: dbKeys }
            }
          });

          for (const row of rows) {
            const id = row.key.slice(type.length + 1);
            try {
              data[id] = JSON.parse(row.value, BufferJSON.reviver);
            } catch {
              // Ignore corruption or parsing errors
            }
          }

          return data;
        },
        set: async (data: any) => {
          const transactions = [];

          for (const type in data) {
            for (const id in data[type]) {
              const value = data[type][id];
              const dbKey = `${type}:${id}`;

              if (value === null || value === undefined) {
                transactions.push(
                  prisma.baileysAuth.deleteMany({
                    where: {
                      instanceId,
                      key: dbKey
                    }
                  })
                );
              } else {
                const serializedValue = JSON.stringify(value, BufferJSON.replacer);
                transactions.push(
                  prisma.baileysAuth.upsert({
                    where: {
                      instanceId_key: {
                        instanceId,
                        key: dbKey
                      }
                    },
                    create: {
                      instanceId,
                      key: dbKey,
                      value: serializedValue
                    },
                    update: {
                      value: serializedValue
                    }
                  })
                );
              }
            }
          }

          if (transactions.length > 0) {
            await prisma.$transaction(transactions);
          }
        }
      }
    },
    saveCreds
  };
}

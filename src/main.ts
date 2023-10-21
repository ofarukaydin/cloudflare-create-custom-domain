import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const token: string = core.getInput('token')
  const projectName: string = core.getInput('project')
  const accountId: string = core.getInput('account-id')
  const name: string = core.getInput('name')
  const operation: string = core.getInput('operation')
  const zoneId: string = core.getInput('zoneId')
  const content: string = core.getInput('content')

  if (operation === 'create') {
    core.debug(`Creating domain ${name} for project ${projectName}`)
    await createRecord({ content, token, zoneId, name })
    await createCustomDomain({ accountId, name, projectName, token })
  } else if (operation === 'delete') {
    core.debug(`Deleting domain ${name} for project ${projectName}`)
    const id = await getCurrentRecordId({ name, token, zoneId })
    core.debug(`Found record id ${id}, deleting`)
    core.debug(`Deleting custom dns ${name}`)
    await deleteRecord({ id, token, zoneId })
    core.debug(`Deleting custom domain ${name}`)
    await deleteCustomDomain({ accountId, name, projectName, token })
  }

  // Set outputs for other workflow steps to use
}

const getCurrentRecordId = async ({
  name,
  token,
  zoneId
}: {
  name: string
  zoneId: string
  token: string
}) => {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    ).then(res => res.json())

    core.debug(JSON.stringify(res))

    if (!res.success) {
      throw new Error('Failed')
    }

    const record = res.find((x: any) => x.name === name)

    return record?.id
  } catch {
    throw new Error('failed')
  }
}

const createRecord = async ({
  content,
  token,
  zoneId,
  name
}: {
  zoneId: string
  content: string
  token: string
  name: string
}) => {
  try {
    const dnsRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'CNAME',
          name,
          content,
          proxied: true
        })
      }
    ).then(res => res.json())

    core.debug(JSON.stringify(dnsRes))

    if (!dnsRes.success) {
      throw new Error('Failed')
    }
  } catch {
    throw Error('failed')
  }
}

const createCustomDomain = async ({
  accountId,
  name,
  projectName,
  token
}: {
  projectName: string
  accountId: string
  token: string
  name: string
}) => {
  try {
    core.debug(`Creating domain ${name} for project ${projectName}`)
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name
        })
      }
    ).then(res => res.json())

    core.debug(JSON.stringify(res))

    if (!res.success) {
      throw new Error('Failed')
    }
  } catch {
    throw Error('failed')
  }
}

const deleteCustomDomain = async ({
  accountId,
  name,
  projectName,
  token
}: {
  accountId: string
  projectName: string
  name: string
  token: string
}) => {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${name}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    ).then(res => res.json())

    core.debug(JSON.stringify(res))

    if (!res.success) {
      throw new Error('Failed')
    }
  } catch {
    throw Error('failed')
  }
}

const deleteRecord = async ({
  id,
  token,
  zoneId
}: {
  token: string
  zoneId: string
  id: string
}) => {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    ).then(res => res.json())

    core.debug(JSON.stringify(res))

    if (!res.success) {
      throw new Error('Failed')
    }
  } catch {
    throw Error('failed')
  }
}

import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token')
    const projectName: string = core.getInput('project')
    const accountId: string = core.getInput('account-id')
    const domain: string = core.getInput('domain')
    const operation: string = core.getInput('operation')

    if (operation === 'create') {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: domain
          })
        }
      ).then(res => res.json())

      if (!res.success) {
        throw new Error(res.errors[0]?.message)
      }
    } else if (operation === 'delete') {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: domain
          })
        }
      ).then(res => res.json())

      if (!res.success) {
        throw new Error(res.errors[0]?.message)
      }
    } else {
      throw new Error('Invalid operation')
    }

    // Set outputs for other workflow steps to use
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

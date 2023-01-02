const path = require('path')

const core = require('@actions/core')
const github = require('@actions/github')

const Reinvite = require('./reinvite')

const run = async () => {
  try {
    const reportPath = core.getInput('report_path', {required: true})

    const filePath = path.join(process.env.GITHUB_WORKSPACE, reportPath)
    const {dir} = path.parse(filePath)

    if (dir.indexOf(process.env.GITHUB_WORKSPACE) < 0) {
      throw new Error(`${reportPath} is not an allowed path`)
    }

    const token = core.getInput('token', {required: true})
    const octokit = new github.getOctokit(token)

    const base = core.getInput('base_sha', {required: true})
    const head = core.getInput('head_sha', {required: true})

    const {owner, repo} = github.context.repo

    const reinvite = new Reinvite(octokit, {
      path: reportPath,
      base,
      head,
      owner,
      repo,
    })

    reinvite.create()
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {run}

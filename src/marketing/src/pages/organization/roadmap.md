---
title: Roadmap
description: The CodeGov organization roadmap
layout: ../../layouts/Layout.astro
---

## Develop CodeGov concept

- Consultation with several developers in the IC community
- Sanity check value statements of the review process and deliverables
- Understand the incentive scale that may be required
- Testing of ic replica build process
- Shape project to use existing tools and apps for implementation
- January - March 2023; Complete...updates will continue to be made as needed

## Build website

- Purchase domain
- No code website
- Beta testing
- February - March 2023; Complete...updates will continue to be made as needed

## Build DSCVR portal

- Define automated poll content
- Define permissions and roles that minimize airdrop farming and maximize the efficiency of the proposal review work process
- Beta testing of polls and submission of reviews
- February - March 2023; Complete...feature enhancements are being considered

## Apply for grant

- DFINITY Developers Grant program
- March 2023; Grant was submitted and has been accepted...currently waiting for the acceptance of milestones and receipt of initial funding

## Create CodeGov neuron

- Any neuron that makes itself public should be committed to always voting on the proposal topics that they claim it will support. To achieve group consensus, all voting members need to be committed to voting on all proposals. At this time it is unclear if a suitable number of people will be willing to commit to voting reliably on the Replica Version Management proposal topic. Hence, the voting on this topic needs to be centralized with the Manager, who is the Founder of the CodeGov project, until it becomes evident that others are committed to performing the work of voting long term.
- The CodeGov neuron will be used for manual voting on Replica Version Management proposal topics. The initial configuration of the neuron will be as follows...
  - Replica Version Management: CodeGov Manager
    - This proposal topic will be voted on manually by the CodeGov Manager based on Reviewer feedback
  - Governance: Synapse.vote
  - SNS & Community Fund: Synapse.vote
  - All Topics (catch-all for everything else): Synapse.vote
  - Manage Neuron: CodeGov Manager
- The CodeGov neuron will be created using the command line tools such as DFX and/or Quill instead of the NNS dApp. This will enable control using the Manage Neuron proposal topic. It will be configured to follow the neuron for the Manager of the CodeGov project initially. However, using the Manage Neuron feature will make it possible to decentralize control of the neuron in the future if the project is successful.
- The neuron ID will be posted on the CodeGov website
- March 2023; Complete...however, this neuron is not managed like most neurons because it is controlled with the Manage Neuron proposal topic. There is very little documentation available regarding the command line functions that are required to control a neuron in this way. As these commands are learned, they will be documented on the CodeGov website for future reference by anyone who wants to create a decentralized neuron that can be controlled by up to 15 other neurons.

## Recruit reviewers

- Start accepting applications for the Reviewer role
- Recruit via the IC Developer Community on Discord
- Personally contact known developers in the IC community
- Consider advertising
- March-May 2023; In Progress

## Conduct reviews

- Begin formal replica reviews if/when grant funding is received
- Continue until funding runs out...initial goal is 6 - 8 weeks
- Create a page on the CodeGov website that can be updated when review summaries for each replica proposal topic are completed. If there are also relevant links to the forum, dashboard, or other social media discussions, then those will be provided as well
- April - May 2023; In Beta testing...Reviewers are encouraged to submit reviews to test the work process

## Evaluate project performance

- Understand the impact of reviews by monitoring key metrics such as...
  - number of Reviewers
  - number of applicants who want to become reviewers
  - the participation rate of reviewers
  - % voting power cast when the CodeGov neuron votes
  - DSCVR portal membership growth
  - website statistics
- Perform sanity checks with developers and community members to determine if CodeGov is adding value or if changes are needed to add more value
- Modify work process as needed to grow and increase value
- If the project is on a trajectory toward success and growth, then seek follow up funding
- April - June 2023

## Submit registered known neuron proposal for CodeGov

- Pursue if the CodeGov project can successfully attract Reviewers
- Form a registered named neuron in the NNS dApp that will vote reliably and independently on every Replica Version Management Proposal
  - Initially, the Manager will cast a manual vote for the CodeGov neuron. Most of the time this should reflect the majority vote after 2 days of the DSCVR poll. However, participation rates and last-minute findings may occasionally drive a vote that is inconsistent with the poll.
  - Evaluate options for other ways to cast the vote for the CodeGov neuron on the Replica Version Management proposal topic. Options include...
    - configure specific CodeGov Reviewers as Followees for the CodeGov neuron
    - configure other known neurons in the IC ecosystem as Followees for the CodeGov neuron
    - automate the CodeGov vote based on the results of the DSCVR poll on each proposal
  - The CodeGov neuron must always vote, so this needs to be taken into consideration before changing the voting strategy
- Evaluate how the CodeGov neuron will become a sustainable voting member of the NNS. Options include...
  - turn the CodeGov project into a DAO and use the Manage Neuron proposal topic with up to 15 Followees configured
  - turn the CodeGov project into an SNS
  - continue controlling the CodeGov neuron with a single Manager
  - if it becomes evident that the CodeGov project is not sustainable, then the neuron will be configured to follow DFINITY
- April - June 2023

## Formalize replica reviews

- Pursue if a CodeGov neuron is approved as a registered known neuron
- Submit summaries of our technical reviews as Governance Motion proposals
- This formal review will be presented to the NNS within 2 days after the replica change proposal is submitted
- This process will provide a mechanism to communicate CodeGov review findings to the NNS voting body before the voting period ends for each Replica Version Management Proposal
- These proposals will continue as long as the NNS governing body approves them routinely. If they are routinely rejected, then it will be a sign that the NNS doesn't need to see them. If they are routinely approved, then they are likely to add value for the NNS voters.
- May - June 2023

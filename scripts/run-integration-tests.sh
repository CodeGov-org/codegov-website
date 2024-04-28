set -e

pnpm -F backend-integration test -- {dev,user_profile}.spec

pnpm -F backend-integration test -- proposal_review.spec -t "create proposal review"

pnpm -F backend-integration test -- proposal_review.spec -t "update proposal review batch one"
pnpm -F backend-integration test -- proposal_review.spec -t "update proposal review batch two"

pnpm -F backend-integration test -- proposal_review.spec -t "list proposal reviews batch one"
pnpm -F backend-integration test -- proposal_review.spec -t "list proposal reviews batch two"
pnpm -F backend-integration test -- proposal_review.spec -t "list proposal reviews batch three"

pnpm -F backend-integration test -- proposal_review.spec -t "get proposal review"

pnpm -F backend-integration test -- proposal_review_commit.spec -t "create proposal review commit batch one"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "create proposal review commit batch two"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "create proposal review commit batch three"

pnpm -F backend-integration test -- proposal_review_commit.spec -t "update proposal review commit batch one"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "update proposal review commit batch two"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "update proposal review commit batch three"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "update proposal review commit batch four"

pnpm -F backend-integration test -- proposal_review_commit.spec -t "delete proposal review commit batch one"
pnpm -F backend-integration test -- proposal_review_commit.spec -t "delete proposal review commit batch two"

pnpm -F backend-integration test -- proposal_review_image.spec -t "update proposal review image batch one"
pnpm -F backend-integration test -- proposal_review_image.spec -t "update proposal review image batch two"
pnpm -F backend-integration test -- proposal_review_image.spec -t "update proposal review image batch three"

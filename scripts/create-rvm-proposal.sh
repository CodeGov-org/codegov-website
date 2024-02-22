NEURON_ID=$( \
  sed -n 's/^NEURON_ID=\([0-9]*\)$/\1/p' ./data/info.txt \
)


NNS_FUNCTION_ARG=$(didc encode -d ./scripts/canisters/registry.did -m update_elected_replica_versions '(
  record {
    release_package_urls = vec {
      "https://download.dfinity.systems/ic/044cfd5147fc97d7e5a214966941b6580c325d72/guest-os/update-img/update-img.tar.gz";
      "https://download.dfinity.network/ic/044cfd5147fc97d7e5a214966941b6580c325d72/guest-os/update-img/update-img.tar.gz";
    };
    replica_version_to_elect = opt "044cfd5147fc97d7e5a214966941b6580c325d72";
    replica_versions_to_unelect = vec {};
  }
)' | sed 's/../\\&/g')

dfx canister call \
  --identity cg-test-proposer \
  --candid ./scripts/canisters/governance.did \
  rrkah-fqaaa-aaaaa-aaaaq-cai \
  manage_neuron \
  '(
    record {
      command = opt variant {
        MakeProposal = record {
          url = "";
          title = opt "Elect new IC/Replica revision (commit 8d4b6898), and retire old replica versions fed43163,072b2a65";
          summary = "Proposal summary";
          action = opt variant {
            ExecuteNnsFunction = record {
              nns_function = 38;
              payload = blob "'${NNS_FUNCTION_ARG}'";
            }
          };
        }
      };
      neuron_id_or_subaccount = opt variant {
        NeuronId = record {
          id = '${NEURON_ID}';
        }
      };
    }
  )'

import { Box, Button, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import CreatePartylistModal from "../../../components/modals/CreatePartylist";
import PartylistCard from "../../../components/PartylistCard";
import { api } from "../../../utils/api";
import { IconFlag } from "@tabler/icons-react";
import Head from "next/head";

const DashboardPartylist = () => {
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);

  const partylists = api.partylist.getAll.useQuery(
    router.query.electionSlug as string,
    {
      enabled: router.isReady,
    }
  );

  return (
    <>
      <Head>
        <title>Partylists | eBoto Mo</title>
      </Head>
      <Stack p="md">
        <Box>
          <Button
            onClick={open}
            sx={(theme) => ({
              [theme.fn.smallerThan("xs")]: { width: "100%" },
            })}
            leftIcon={<IconFlag size="1rem" />}
            loading={partylists.isLoading}
          >
            Add partylist
          </Button>
        </Box>

        <Group spacing="xs">
          {partylists.isLoading ? (
            <>
              {[...Array(7).keys()].map((i) => (
                <Skeleton
                  key={i}
                  sx={(theme) => ({
                    width: 180,
                    height: 172,
                    borderRadius: theme.radius.md,

                    [theme.fn.smallerThan("xs")]: { width: "100%" },
                  })}
                />
              ))}
            </>
          ) : partylists.isError ? (
            <Text>Error: {partylists.error.message}</Text>
          ) : (
            <>
              <Head>
                <title>
                  {partylists.data.election.name} &ndash; Partylists | eBoto Mo
                </title>
              </Head>
              <CreatePartylistModal
                isOpen={opened}
                onClose={close}
                electionId={partylists.data.election.id}
              />
              {!partylists.data.partylists.length ? (
                <Text>No partylists yet.</Text>
              ) : (
                partylists.data.partylists.map((partylist) => (
                  <PartylistCard key={partylist.id} partylist={partylist} />
                ))
              )}
            </>
          )}
        </Group>
      </Stack>
    </>
  );
};

export default DashboardPartylist;

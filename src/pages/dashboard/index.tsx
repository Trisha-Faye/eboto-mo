import {
  Box,
  Button,
  Container,
  Group,
  Text,
  Title,
  Stack,
  Skeleton,
  Flex,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import Head from "next/head";
import DashboardCard from "../../components/DashboardCard";
import CreateElectionModal from "../../components/modals/CreateElection";
import { api } from "../../utils/api";

const DashboardPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const myElections = api.election.getMyElections.useQuery();
  const myElectionVote = api.election.getMyElectionsVote.useQuery();

  return (
    <>
      <Head>
        <title>Dashboard | eBoto Mo</title>
      </Head>
      <CreateElectionModal isOpen={opened} onClose={close} />
      <Container p="md">
        <Stack spacing="lg">
          <Box>
            <Flex align="center" justify="space-between">
              <Title
                order={2}
                sx={(theme) => ({
                  [theme.fn.smallerThan("xs")]: {
                    fontSize: theme.fontSizes.xl,
                  },
                })}
              >
                My elections
              </Title>

              <Button
                onClick={open}
                leftIcon={<IconPlus size="1.25rem" />}
                sx={(theme) => ({
                  [theme.fn.smallerThan("xs")]: { display: "none" },
                })}
              >
                Create election
              </Button>
              <Button
                onClick={open}
                leftIcon={<IconPlus size="1rem" />}
                sx={(theme) => ({
                  [theme.fn.largerThan("xs")]: { display: "none" },
                })}
                size="xs"
              >
                Create
              </Button>
            </Flex>
            <Text
              size="xs"
              color="grayText"
              sx={(theme) => ({
                marginBottom: theme.spacing.xs,
              })}
            >
              You can manage the elections below.
            </Text>
            <Group>
              {!myElections.data || myElections.isLoading ? (
                [...Array(3).keys()].map((i) => (
                  <Skeleton
                    key={i}
                    width={250}
                    height={332}
                    radius="md"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: { width: "100%" },
                    })}
                  />
                ))
              ) : myElections.data.length === 0 ? (
                <Box h={72}>
                  <Text>No elections found</Text>
                </Box>
              ) : (
                myElections.data.map((election) => (
                  <DashboardCard
                    election={election}
                    key={election.id}
                    type="manage"
                  />
                ))
              )}
            </Group>
          </Box>

          <Box>
            <Title
              order={2}
              sx={(theme) => ({
                [theme.fn.smallerThan("xs")]: {
                  fontSize: theme.fontSizes.xl,
                },
              })}
            >
              My elections I can vote in
            </Title>
            <Text
              size="xs"
              color="grayText"
              sx={(theme) => ({
                marginBottom: theme.spacing.xs,
              })}
            >
              You can vote in the elections below. You can only vote once per
              election.
            </Text>

            <Group>
              {!myElectionVote.data || myElectionVote.isLoading ? (
                [...Array(3).keys()].map((i) => (
                  <Skeleton
                    key={i}
                    width={250}
                    height={352}
                    radius="md"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: { width: "100%" },
                    })}
                  />
                ))
              ) : myElectionVote.data.length === 0 ? (
                <Box h={72}>
                  <Text>No vote elections found</Text>
                </Box>
              ) : (
                myElectionVote.data.map((election) => (
                  <DashboardCard
                    election={election}
                    key={election.id}
                    type="vote"
                    vote={election.vote}
                  />
                ))
              )}
            </Group>
          </Box>
        </Stack>
      </Container>
    </>
  );
};

export default DashboardPage;

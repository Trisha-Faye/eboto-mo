import {
  Container,
  Text,
  Table,
  Flex,
  SimpleGrid,
  Title,
  Center,
  Stack,
  Box,
  Group,
  Loader,
} from "@mantine/core";
import type { Election } from "@prisma/client";
import { IconFingerprint } from "@tabler/icons-react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";
import Balancer from "react-wrap-balancer";
import Head from "next/head";
import ScrollToTopButton from "../../components/ScrollToTopButton";
import { isElectionOngoing } from "../../utils/isElectionOngoing";
import { isElectionEnded } from "../../utils/isElectionEnded";

const RealtimePage = ({
  election,
  isOngoing,
}: {
  election: Election;
  isOngoing: boolean;
}) => {
  const isEnded = isElectionEnded({ election });

  const now = new Date();

  const title = `${election.name} – Realtime | eBoto Mo`;
  const positions = api.election.getElectionRealtime.useQuery(election.id, {
    refetchInterval: !isEnded ? 1000 : undefined,
  });

  const voterFieldsStats = api.voter.getFieldsStats.useQuery(
    { electionSlug: election.slug },
    {
      refetchInterval: !isEnded ? 1000 : undefined,
    }
  );

  if (positions.isLoading)
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  if (positions.isError) return <div>Error: {positions.error.message}</div>;

  if (!positions.data) return <div>No data</div>;
  return (
    <>
      <ScrollToTopButton />
      <Head>
        <title>{title}</title>
      </Head>
      <Container py="xl">
        <Stack spacing="xl">
          <Center>
            <Box>
              <Group position="center" mb={8}>
                {election.logo ? (
                  <Image
                    src={election.logo}
                    alt="Logo"
                    width={92}
                    height={92}
                    priority
                  />
                ) : (
                  <IconFingerprint size={92} style={{ padding: 8 }} />
                )}
              </Group>
              <Title order={2} lineClamp={2} align="center">
                {election.name} (@{election.slug})
              </Title>
              <Text align="center">
                <Moment format="MMMM DD, YYYY" date={election.start_date} />
                {" - "}
                <Moment format="MMMM DD, YYYY" date={election.end_date} />
              </Text>
              <Text align="center">
                Open from {convertNumberToHour(election.voting_start)} to{" "}
                {convertNumberToHour(election.voting_end)}
              </Text>
              {!isEnded ? (
                <Text align="center" size="xs" color="dimmed">
                  <Balancer>
                    Realtime result as of{" "}
                    <Moment date={now} format="MMMM Do YYYY, h:mm:ss A" />
                  </Balancer>
                </Text>
              ) : (
                <Text align="center" weight="bold">
                  Official result as of{" "}
                  <Moment
                    date={
                      new Date(
                        new Date(election.end_date).setHours(
                          election.voting_end
                        )
                      )
                    }
                    format="MMMM Do YYYY, h A"
                  />
                </Text>
              )}
            </Box>
          </Center>

          <Stack spacing="xl">
            <SimpleGrid
              cols={3}
              breakpoints={[
                { maxWidth: "md", cols: 2, spacing: "md" },
                { maxWidth: "xs", cols: 1, spacing: "sm" },
              ]}
            >
              {positions.data.map((position) => (
                <Table
                  key={position.id}
                  striped
                  highlightOnHover
                  withBorder
                  captionSide="bottom"
                  h="fit-content"
                >
                  {!isEnded && (
                    <caption>
                      As of{" "}
                      <Moment date={now} format="MMMM Do YYYY, h:mm:ss A" />
                    </caption>
                  )}
                  <thead>
                    <tr>
                      <th>
                        <Text lineClamp={2}>{position.name}</Text>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {position.candidate
                      .sort((a, b) => b.vote.length - a.vote.length)
                      .map((candidate) => (
                        <tr key={candidate.id}>
                          <td>
                            <Flex justify="space-between" align="center">
                              <Text lineClamp={2}>
                                {isOngoing
                                  ? candidate.first_name
                                  : `${candidate.last_name}, ${
                                      candidate.first_name
                                    }
                            ${
                              candidate.middle_name
                                ? " " + candidate.middle_name.charAt(0) + "."
                                : ""
                            } (${candidate.partylist.acronym})`}
                              </Text>
                              <Text>{candidate.vote.length}</Text>
                            </Flex>
                          </td>
                        </tr>
                      ))}
                    <tr>
                      <td>
                        <Flex justify="space-between">
                          <Text>Abstain</Text>
                          <Text>{position.vote.length}</Text>
                        </Flex>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              ))}
            </SimpleGrid>
            <Stack spacing="sm">
              <Title order={3} align="center">
                Voter Stats
              </Title>
              {voterFieldsStats.isLoading ? (
                <Center>
                  <Loader size="sm" />
                </Center>
              ) : !voterFieldsStats.data ||
                voterFieldsStats.data.length === 0 ? (
                <Text align="center">No voter stats</Text>
              ) : (
                <SimpleGrid
                  cols={2}
                  sx={{
                    alignItems: "start",
                  }}
                  breakpoints={[
                    {
                      maxWidth: "md",
                      cols: 1,
                    },
                  ]}
                >
                  {voterFieldsStats.data.map((voterFieldStat) => (
                    <Table
                      key={voterFieldStat.fieldName}
                      striped
                      highlightOnHover
                      withBorder
                      withColumnBorders
                    >
                      <thead>
                        <tr>
                          <th>{voterFieldStat.fieldName}</th>
                          <th>Voted</th>
                          <th>Voter (Accepted)</th>
                          <th>Voter (Invited)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voterFieldStat.fields.map((field) => (
                          <tr key={field.fieldValue}>
                            <td>{field.fieldValue}</td>
                            <td>{field.voteCount}</td>
                            <td>{field.allCountAccepted}</td>
                            <td>{field.allCountInvited}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </>
  );
};

export default RealtimePage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const election = await prisma.election.findUnique({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!election) return { notFound: true };

  if (election.publicity === "PRIVATE") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
          permanent: false,
        },
      };

    const isCommissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!isCommissioner) return { notFound: true };

    const isVoter = await prisma.voter.findFirst({
      where: {
        userId: isCommissioner.userId,
        electionId: election.id,
      },
    });

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: isCommissioner.userId,
        electionId: election.id,
      },
    });

    if (isVoter && !vote)
      return {
        redirect: {
          destination: `/${election.slug}`,
          permanent: false,
        },
      };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return {
        redirect: {
          destination: `/signin?callbackUrl=https://eboto-mo.com/${election.slug}/realtime`,
          permanent: false,
        },
      };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    const isVoter = await prisma.voter.findFirst({
      where: {
        userId: session.user.id,
        electionId: election.id,
      },
    });

    const isCommissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!isVoter && !isCommissioner) return { notFound: true };

    if (
      (!vote && isVoter) ||
      (!isElectionOngoing({ election, withTime: true }) && isVoter && !vote)
    )
      return {
        redirect: { destination: `/${election.slug}`, permanent: false },
      };
  }

  return {
    props: {
      election,
      isOngoing: isElectionOngoing({ election, withTime: true }),
    },
  };
};

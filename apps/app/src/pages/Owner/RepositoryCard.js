import { GearIcon, RepoIcon } from "@primer/octicons-react";
import { gql } from "graphql-tag";

import {
  Card,
  CardHeader,
  CardTitle,
  Icon,
  IllustratedText,
  Link,
  LinkBlock,
  TagButton,
} from "@argos-ci/app/src/components";

export const OwnerRepositoryCardFragment = gql`
  fragment OwnerRepositoryCardFragment on Repository {
    name
  }
`;

export function NoRepositoryCard() {
  return (
    <Card>
      <CardHeader border={0}>
        <CardTitle>No repository found</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function ActiveRepositoryCard({ repository, url, ...props }) {
  return (
    <Card {...props}>
      <CardHeader border={0}>
        <CardTitle display="flex" alignItems="center" gap={2}>
          <IllustratedText icon={RepoIcon} gap={2}>
            <Link to={`${url}/builds`}>{repository.name}</Link>
          </IllustratedText>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function InactiveRepositoryCard({ repository, url, ...props }) {
  return (
    <Card {...props}>
      <CardHeader border={0}>
        <CardTitle display="flex" alignItems="flex-start" gap={2}>
          <IllustratedText icon={RepoIcon} gap={2}>
            <Link to={`${url}/builds`}>{repository.name}</Link>
          </IllustratedText>
        </CardTitle>
        <TagButton as={LinkBlock} to={`${url}/settings`}>
          <Icon as={GearIcon} />
          Settings
        </TagButton>
      </CardHeader>
    </Card>
  );
}
